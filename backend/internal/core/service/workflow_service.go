package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type WorkflowService interface {
	SubmitPurchase(ctx context.Context, purchaseID uuid.UUID) error
	ApprovePurchase(ctx context.Context, purchaseID, userID uuid.UUID, roleID uuid.UUID, comments string) error
	RejectPurchase(ctx context.Context, purchaseID, userID uuid.UUID, roleID uuid.UUID, comments string) error
}

type workflowService struct {
	db           *gorm.DB
	purchaseRepo domain.PurchaseRepository
	workflowRepo domain.WorkflowRepository
	userRepo     domain.UserRepository
}

func NewWorkflowService(db *gorm.DB, purchaseRepo domain.PurchaseRepository, workflowRepo domain.WorkflowRepository, userRepo domain.UserRepository) WorkflowService {
	return &workflowService{
		db:           db,
		purchaseRepo: purchaseRepo,
		workflowRepo: workflowRepo,
		userRepo:     userRepo,
	}
}

func (s *workflowService) SubmitPurchase(ctx context.Context, purchaseID uuid.UUID) error {
	purchase, _, err := s.purchaseRepo.FindByID(ctx, purchaseID)
	if err != nil {
		return errors.New("purchase not found")
	}

	if purchase.Status != "DRAFT" {
		return errors.New("purchase must be in DRAFT status to submit")
	}

	workflow, err := s.workflowRepo.FindWorkflowForPurchase(ctx, purchase.DepartmentID, purchase.TotalAmount)
	if err != nil {
		return errors.New("no approval workflow found for this department and amount")
	}

	steps, err := s.workflowRepo.FindStepsByWorkflowID(ctx, workflow.ID)
	if err != nil || len(steps) == 0 {
		return errors.New("workflow has no steps configured")
	}

	// First step based on step_order ascend
	firstStep := steps[0]

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return s.purchaseRepo.UpdateStatusAndStep(ctx, tx, purchase.ID, "PENDING_APPROVAL", &firstStep.ID)
	})
}

func (s *workflowService) ApprovePurchase(ctx context.Context, purchaseID, userID uuid.UUID, roleID uuid.UUID, comments string) error {
	purchase, _, err := s.purchaseRepo.FindByID(ctx, purchaseID)
	if err != nil {
		return errors.New("purchase not found")
	}

	if purchase.Status != "PENDING_APPROVAL" || purchase.CurrentStepID == nil {
		return errors.New("purchase is not pending approval")
	}

	step, err := s.workflowRepo.FindStepByID(ctx, *purchase.CurrentStepID)
	if err != nil {
		return errors.New("current workflow step not found")
	}

	// VALIDACAO CRITICA
	if !s.isUserAuthorizedForStep(step, userID, roleID) {
		return errors.New("403 Forbidden: you are not authorized to approve this step")
	}

	// VALIDACAO CROSS-DEPARTMENT (View-only for others)
	if !s.userHasDepartment(ctx, userID, purchase.DepartmentID) {
		return errors.New("403 Forbidden: you can only approve purchases from your assigned departments")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create Log
		log := &models.PurchaseApproval{
			PurchaseID: purchase.ID,
			StepID:     step.ID,
			ActedBy:    userID,
			Action:     "APPROVED",
			Comments:   comments,
		}
		if err := s.workflowRepo.CreateApprovalLog(ctx, tx, log); err != nil {
			return err
		}

		// Find next step
		steps, err := s.workflowRepo.FindStepsByWorkflowID(ctx, step.WorkflowID)
		if err != nil {
			return err
		}

		var nextStepID *uuid.UUID
		foundCurrent := false
		for _, st := range steps {
			if foundCurrent {
				nextStepID = &st.ID
				break
			}
			if st.ID == step.ID {
				foundCurrent = true
			}
		}

		newStatus := "PENDING_APPROVAL"
		if nextStepID == nil {
			newStatus = "APPROVED" // It was the last step
		}

		return s.purchaseRepo.UpdateStatusAndStep(ctx, tx, purchase.ID, newStatus, nextStepID)
	})
}

func (s *workflowService) RejectPurchase(ctx context.Context, purchaseID, userID uuid.UUID, roleID uuid.UUID, comments string) error {
	if comments == "" {
		return errors.New("comments are required for rejection")
	}

	purchase, _, err := s.purchaseRepo.FindByID(ctx, purchaseID)
	if err != nil {
		return errors.New("purchase not found")
	}

	if purchase.Status != "PENDING_APPROVAL" || purchase.CurrentStepID == nil {
		return errors.New("purchase is not pending approval")
	}

	step, err := s.workflowRepo.FindStepByID(ctx, *purchase.CurrentStepID)
	if err != nil {
		return errors.New("current workflow step not found")
	}

	// VALIDACAO CRITICA
	if !s.isUserAuthorizedForStep(step, userID, roleID) {
		return errors.New("403 Forbidden: you are not authorized to reject this step")
	}

	// VALIDACAO CROSS-DEPARTMENT (View-only for others)
	if !s.userHasDepartment(ctx, userID, purchase.DepartmentID) {
		return errors.New("403 Forbidden: you can only reject purchases from your assigned departments")
	}

	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Create Log
		log := &models.PurchaseApproval{
			PurchaseID: purchase.ID,
			StepID:     step.ID,
			ActedBy:    userID,
			Action:     "REJECTED",
			Comments:   comments,
		}
		if err := s.workflowRepo.CreateApprovalLog(ctx, tx, log); err != nil {
			return err
		}

		// Immediately reject
		return s.purchaseRepo.UpdateStatusAndStep(ctx, tx, purchase.ID, "REJECTED", nil)
	})
}

func (s *workflowService) isUserAuthorizedForStep(step *models.WorkflowStep, userID uuid.UUID, roleID uuid.UUID) bool {
	// Specific user is required
	if step.ApproverUserID != nil {
		if *step.ApproverUserID == userID {
			return true
		}
	}

	// Specific role is required
	if step.ApproverRoleID != nil {
		if *step.ApproverRoleID == roleID {
			return true
		}
	}

	return false
}

func (s *workflowService) userHasDepartment(ctx context.Context, userID uuid.UUID, targetDeptID uuid.UUID) bool {
	// Superadmins bypass this or we rely strictly on the struct if they are approvers.
	// But let's assume if it reached here, they MUST belong to the department.
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return false
	}

	for _, dept := range user.Departments {
		if dept.ID == targetDeptID {
			return true
		}
	}
	return false
}

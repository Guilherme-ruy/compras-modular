package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type PurchaseInput struct {
	DepartmentID uuid.UUID           `json:"department_id"`
	TotalAmount  float64             `json:"total_amount"`
	Metadata     datatypes.JSON      `json:"metadata"`
	Items        []PurchaseItemInput `json:"items"`
}

type PurchaseItemInput struct {
	Description string  `json:"description"`
	Quantity    float64 `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
}

type PurchaseResponse struct {
	Purchase models.Purchase           `json:"purchase"`
	Items    []models.PurchaseItem     `json:"items"`
	StepInfo *StepInfoResponse         `json:"step_info,omitempty"`
	History  []models.PurchaseApproval `json:"history,omitempty"`
}

type StepInfoResponse struct {
	StepOrder    int    `json:"step_order"`
	ApproverRole string `json:"approver_role,omitempty"`
	ApproverName string `json:"approver_name,omitempty"`
}

type PurchaseService interface {
	CreatePurchase(ctx context.Context, userID uuid.UUID, input PurchaseInput) (*models.Purchase, error)
	GetPurchaseByID(ctx context.Context, id uuid.UUID, userID uuid.UUID, roleName string) (*PurchaseResponse, error)
	ListPurchases(ctx context.Context, userID uuid.UUID, roleName string, statusFilter string, deptFilter *uuid.UUID) ([]models.Purchase, error)
}

type purchaseService struct {
	purchaseRepo domain.PurchaseRepository
	userRepo     domain.UserRepository
	workflowRepo domain.WorkflowRepository
	roleRepo     domain.RoleRepository
}

func NewPurchaseService(purchaseRepo domain.PurchaseRepository, userRepo domain.UserRepository, workflowRepo domain.WorkflowRepository, roleRepo domain.RoleRepository) PurchaseService {
	return &purchaseService{
		purchaseRepo: purchaseRepo,
		userRepo:     userRepo,
		workflowRepo: workflowRepo,
		roleRepo:     roleRepo,
	}
}

func (s *purchaseService) CreatePurchase(ctx context.Context, userID uuid.UUID, input PurchaseInput) (*models.Purchase, error) {
	// The Department is now explicitly requested, but we still secure the RequesterID
	purchase := &models.Purchase{
		RequesterID:  userID,
		DepartmentID: input.DepartmentID,
		TotalAmount:  input.TotalAmount,
		Status:       "DRAFT", // Hard requirement: starts as DRAFT
		Metadata:     input.Metadata,
	}

	var items []models.PurchaseItem
	for _, item := range input.Items {
		items = append(items, models.PurchaseItem{
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
		})
	}

	if err := s.purchaseRepo.Create(ctx, purchase, items); err != nil {
		return nil, err
	}

	return purchase, nil
}

func (s *purchaseService) GetPurchaseByID(ctx context.Context, id uuid.UUID, userID uuid.UUID, roleName string) (*PurchaseResponse, error) {
	purchase, items, err := s.purchaseRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("purchase not found")
	}

	// RBAC check: if requester, can only see their department's purchases
	if roleName == "REQUESTER" {
		// The chunk above handles the multi-department validation
		user, err := s.userRepo.FindByID(ctx, userID)
		if err != nil {
			return nil, errors.New("user not found")
		}

		// check if user belongs to the purchase department
		authorized := false
		for _, dept := range user.Departments {
			if dept.ID == purchase.DepartmentID {
				authorized = true
				break
			}
		}

		if !authorized {
			return nil, errors.New("unauthorized to view this purchase")
		}
	} // Viewer, Admin, Superadmin can view it

	var stepInfo *StepInfoResponse
	if purchase.CurrentStepID != nil {
		step, err := s.workflowRepo.FindStepByID(ctx, *purchase.CurrentStepID)
		if err == nil {
			info := &StepInfoResponse{StepOrder: step.StepOrder}
			if step.ApproverRoleID != nil {
				role, err := s.roleRepo.FindByID(ctx, *step.ApproverRoleID)
				if err == nil {
					info.ApproverRole = role.Name
				}
			}
			if step.ApproverUserID != nil {
				u, err := s.userRepo.FindByID(ctx, *step.ApproverUserID)
				if err == nil {
					info.ApproverName = u.Name
				}
			}
			stepInfo = info
		}
	}

	history, _ := s.purchaseRepo.GetApprovalHistory(ctx, id)

	return &PurchaseResponse{
		Purchase: *purchase,
		Items:    items,
		StepInfo: stepInfo,
		History:  history,
	}, nil
}

func (s *purchaseService) ListPurchases(ctx context.Context, userID uuid.UUID, roleName string, statusFilter string, deptFilter *uuid.UUID) ([]models.Purchase, error) {
	var finalDeptID *uuid.UUID

	if roleName == "REQUESTER" {
		user, err := s.userRepo.FindByID(ctx, userID)
		if err != nil {
			return nil, errors.New("user not found")
		}
		if len(user.Departments) == 0 {
			return []models.Purchase{}, nil
		}

		// Security: Requesters can only filter for departments they belong to.
		// If no filter is provided, we'll let the repo handle it or default to their first dept for now.
		// In a multi-dept scenario, ideally the repo should accept a list of IDs.
		
		isAuthorizedDept := false
		if deptFilter != nil {
			for _, d := range user.Departments {
				if d.ID == *deptFilter {
					isAuthorizedDept = true
					break
				}
			}
		}

		if deptFilter != nil && !isAuthorizedDept {
			return nil, errors.New("unauthorized to view purchases for this department")
		}

		if deptFilter != nil {
			finalDeptID = deptFilter
		} else {
			// Default to first department if requester doesn't specify one
			// (Assuming requester must always be scoped to a department)
			firstID := user.Departments[0].ID
			finalDeptID = &firstID
		}
	} else {
		// ADMIN, SUPERADMIN, VIEWER can filter by any department
		finalDeptID = deptFilter
	}

	purchases, err := s.purchaseRepo.List(ctx, finalDeptID, statusFilter)
	if err != nil {
		return nil, err
	}

	return purchases, nil
}

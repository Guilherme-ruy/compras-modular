package repository

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type workflowRepository struct {
	db *gorm.DB
}

func NewWorkflowRepository(db *gorm.DB) domain.WorkflowRepository {
	return &workflowRepository{db: db}
}

func (r *workflowRepository) CreateWorkflow(ctx context.Context, workflow *models.ApprovalWorkflow) error {
	return r.db.WithContext(ctx).Create(workflow).Error
}

func (r *workflowRepository) CreateStep(ctx context.Context, step *models.WorkflowStep) error {
	return r.db.WithContext(ctx).Create(step).Error
}

func (r *workflowRepository) FindWorkflowForPurchase(ctx context.Context, departmentID uuid.UUID, amount float64) (*models.ApprovalWorkflow, error) {
	var workflow models.ApprovalWorkflow
	err := r.db.WithContext(ctx).
		Where("department_id = ? AND min_amount <= ?", departmentID, amount).
		Order("min_amount desc").
		First(&workflow).Error
	if err != nil {
		return nil, err
	}
	return &workflow, nil
}

func (r *workflowRepository) FindAll(ctx context.Context) ([]models.ApprovalWorkflow, error) {
	var workflows []models.ApprovalWorkflow
	err := r.db.WithContext(ctx).Find(&workflows).Error
	return workflows, err
}

func (r *workflowRepository) UpdateWorkflow(ctx context.Context, workflow *models.ApprovalWorkflow) error {
	return r.db.WithContext(ctx).Save(workflow).Error
}

func (r *workflowRepository) DeleteWorkflow(ctx context.Context, workflowID uuid.UUID) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Cascade delete steps first if FK isn't set to do it automatically
		if err := tx.Where("workflow_id = ?", workflowID).Delete(&models.WorkflowStep{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.ApprovalWorkflow{}, "id = ?", workflowID).Error
	})
}

func (r *workflowRepository) FindStepsByWorkflowID(ctx context.Context, workflowID uuid.UUID) ([]models.WorkflowStep, error) {
	var steps []models.WorkflowStep
	err := r.db.WithContext(ctx).
		Where("workflow_id = ?", workflowID).
		Order("step_order asc").
		Find(&steps).Error
	if err != nil {
		return nil, err
	}
	return steps, nil
}

func (r *workflowRepository) FindStepByID(ctx context.Context, stepID uuid.UUID) (*models.WorkflowStep, error) {
	var step models.WorkflowStep
	err := r.db.WithContext(ctx).First(&step, "id = ?", stepID).Error
	if err != nil {
		return nil, err
	}
	return &step, nil
}

func (r *workflowRepository) CreateApprovalLog(ctx context.Context, tx *gorm.DB, approval *models.PurchaseApproval) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.WithContext(ctx).Create(approval).Error
}

func (r *workflowRepository) ReplaceSteps(ctx context.Context, workflowID uuid.UUID, newSteps []models.WorkflowStep) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete old steps
		if err := tx.Where("workflow_id = ?", workflowID).Delete(&models.WorkflowStep{}).Error; err != nil {
			return err
		}

		// Insert new steps
		if len(newSteps) > 0 {
			if err := tx.Create(&newSteps).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

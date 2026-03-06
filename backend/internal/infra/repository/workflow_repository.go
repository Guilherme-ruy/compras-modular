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

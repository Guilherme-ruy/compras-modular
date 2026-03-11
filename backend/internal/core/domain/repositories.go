package domain

import (
	"compras-modular/backend/internal/infra/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserRepository interface {
	FindByEmail(ctx context.Context, email string) (*models.User, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	FindAll(ctx context.Context) ([]models.User, error)
	Create(ctx context.Context, user *models.User) error
}

type RoleRepository interface {
	FindByID(ctx context.Context, id uuid.UUID) (*models.Role, error)
	FindByName(ctx context.Context, name string) (*models.Role, error)
	FindAll(ctx context.Context) ([]models.Role, error)
}

type SystemSettingsRepository interface {
	GetSettings(ctx context.Context) (*models.SystemSettings, error)
	UpdateSettings(ctx context.Context, settings *models.SystemSettings) error
}

type DepartmentRepository interface {
	FindAll(ctx context.Context) ([]models.Department, error)
	FindByID(ctx context.Context, id uuid.UUID) (*models.Department, error)
	Create(ctx context.Context, dept *models.Department) error
}

type PurchaseRepository interface {
	Create(ctx context.Context, purchase *models.Purchase, items []models.PurchaseItem) error
	FindByID(ctx context.Context, id uuid.UUID) (*models.Purchase, []models.PurchaseItem, error)
	List(ctx context.Context, departmentID *uuid.UUID, status string) ([]models.Purchase, error)
	UpdateStatusAndStep(ctx context.Context, tx *gorm.DB, purchaseID uuid.UUID, status string, stepID *uuid.UUID) error
}

type WorkflowRepository interface {
	CreateWorkflow(ctx context.Context, workflow *models.ApprovalWorkflow) error
	CreateStep(ctx context.Context, step *models.WorkflowStep) error
	FindWorkflowForPurchase(ctx context.Context, departmentID uuid.UUID, amount float64) (*models.ApprovalWorkflow, error)
	FindStepsByWorkflowID(ctx context.Context, workflowID uuid.UUID) ([]models.WorkflowStep, error)
	FindStepByID(ctx context.Context, stepID uuid.UUID) (*models.WorkflowStep, error)
	CreateApprovalLog(ctx context.Context, tx *gorm.DB, approval *models.PurchaseApproval) error
}

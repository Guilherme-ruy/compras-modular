package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type SystemSettings struct {
	ID          int            `gorm:"primaryKey" json:"id"`
	CompanyName string         `gorm:"size:255;not null" json:"company_name"`
	Document    string         `gorm:"size:50" json:"document"`
	ThemeConfig datatypes.JSON `gorm:"type:jsonb" json:"theme_config"`
}

type Department struct {
	ID       uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name     string     `gorm:"size:255;not null" json:"name"`
	ParentID *uuid.UUID `gorm:"type:uuid" json:"parent_id"`
}

type Role struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	Name        string         `gorm:"size:50;not null;unique" json:"name"`
	Permissions datatypes.JSON `gorm:"type:jsonb" json:"permissions"`
}

type User struct {
	ID           uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	RoleID       uuid.UUID  `gorm:"type:uuid;not null" json:"role_id"`
	Name         string     `gorm:"size:255;not null" json:"name"`
	Email        string     `gorm:"size:255;not null;unique" json:"email"`
	PasswordHash string     `gorm:"size:255;not null" json:"-"`
	IsActive     bool       `gorm:"default:true" json:"is_active"`
	
	Departments  []Department `gorm:"many2many:user_departments;" json:"departments,omitempty"`
	Role         *Role        `gorm:"foreignKey:RoleID" json:"role,omitempty"`
}

type Purchase struct {
	ID            uuid.UUID      `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	RequesterID   uuid.UUID      `gorm:"type:uuid;not null" json:"requester_id"`
	DepartmentID  uuid.UUID      `gorm:"type:uuid;not null" json:"department_id"`
	TotalAmount   float64        `gorm:"type:decimal(10,2);not null" json:"total_amount"`
	Status        string         `gorm:"size:50;not null" json:"status"` // DRAFT, PENDING_APPROVAL, APPROVED, REJECTED
	CurrentStepID *uuid.UUID     `gorm:"type:uuid" json:"current_step_id"`
	Metadata      datatypes.JSON `gorm:"type:jsonb" json:"metadata"`
}

type PurchaseItem struct {
	ID          uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	PurchaseID  uuid.UUID `gorm:"type:uuid;not null" json:"purchase_id"`
	Description string    `gorm:"size:255;not null" json:"description"`
	Quantity    float64   `gorm:"type:decimal(10,2);not null" json:"quantity"`
	UnitPrice   float64   `gorm:"type:decimal(10,2);not null" json:"unit_price"`
}

type ApprovalWorkflow struct {
	ID           uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	DepartmentID uuid.UUID `gorm:"type:uuid;not null" json:"department_id"`
	MinAmount    float64   `gorm:"type:decimal(10,2);not null" json:"min_amount"`
}

type WorkflowStep struct {
	ID             uuid.UUID  `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	WorkflowID     uuid.UUID  `gorm:"type:uuid;not null" json:"workflow_id"`
	StepOrder      int        `gorm:"not null" json:"step_order"`
	ApproverRoleID *uuid.UUID `gorm:"type:uuid" json:"approver_role_id"`
	ApproverUserID *uuid.UUID `gorm:"type:uuid" json:"approver_user_id"`
}

type PurchaseApproval struct {
	ID         uuid.UUID `gorm:"type:uuid;primaryKey;default:uuid_generate_v4()" json:"id"`
	PurchaseID uuid.UUID `gorm:"type:uuid;not null" json:"purchase_id"`
	StepID     uuid.UUID `gorm:"type:uuid;not null" json:"step_id"`
	ActedBy    uuid.UUID `gorm:"type:uuid;not null" json:"acted_by"`
	Action     string    `gorm:"size:50;not null" json:"action"` // APPROVED, REJECTED
	Comments   string    `gorm:"type:text" json:"comments"`
	ActedAt    time.Time `gorm:"autoCreateTime" json:"acted_at"`
}

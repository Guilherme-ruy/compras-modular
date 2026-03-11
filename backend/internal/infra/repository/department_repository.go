package repository

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type departmentRepository struct {
	db *gorm.DB
}

func NewDepartmentRepository(db *gorm.DB) domain.DepartmentRepository {
	return &departmentRepository{db: db}
}

func (r *departmentRepository) FindAll(ctx context.Context) ([]models.Department, error) {
	var departments []models.Department
	err := r.db.WithContext(ctx).Order("name asc").Find(&departments).Error
	return departments, err
}

func (r *departmentRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Department, error) {
	var department models.Department
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&department).Error
	return &department, err
}

func (r *departmentRepository) Create(ctx context.Context, dept *models.Department) error {
	return r.db.WithContext(ctx).Create(dept).Error
}

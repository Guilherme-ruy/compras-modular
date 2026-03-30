package repository

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type supplierRepository struct {
	db *gorm.DB
}

func NewSupplierRepository(db *gorm.DB) domain.SupplierRepository {
	return &supplierRepository{db: db}
}

func (r *supplierRepository) FindAll(ctx context.Context, search string, status string) ([]models.Supplier, error) {
	var suppliers []models.Supplier
	query := r.db.WithContext(ctx)

	if search != "" {
		searchTerm := "%" + search + "%"
		query = query.Where("company_name ILIKE ? OR trade_name ILIKE ? OR cnpj ILIKE ?", searchTerm, searchTerm, searchTerm)
	}

	if status == "active" {
		query = query.Where("is_active = ?", true)
	} else if status == "inactive" {
		query = query.Where("is_active = ?", false)
	}

	err := query.Order("company_name asc").Find(&suppliers).Error
	return suppliers, err
}

func (r *supplierRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	var supplier models.Supplier
	err := r.db.WithContext(ctx).First(&supplier, "id = ?", id).Error
	return &supplier, err
}

func (r *supplierRepository) Create(ctx context.Context, supplier *models.Supplier) error {
	return r.db.WithContext(ctx).Create(supplier).Error
}

func (r *supplierRepository) Update(ctx context.Context, supplier *models.Supplier) error {
	return r.db.WithContext(ctx).Save(supplier).Error
}

func (r *supplierRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&models.Supplier{}, "id = ?", id).Error
}

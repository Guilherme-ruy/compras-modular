package repository

import (
	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"
	"context"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type purchaseRepository struct {
	db *gorm.DB
}

func NewPurchaseRepository(db *gorm.DB) domain.PurchaseRepository {
	return &purchaseRepository{db: db}
}

func (r *purchaseRepository) Create(ctx context.Context, purchase *models.Purchase, items []models.PurchaseItem) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(purchase).Error; err != nil {
			return err
		}

		for i := range items {
			items[i].PurchaseID = purchase.ID // Link item to purchase
		}

		if len(items) > 0 {
			if err := tx.Create(&items).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *purchaseRepository) FindByID(ctx context.Context, id uuid.UUID) (*models.Purchase, []models.PurchaseItem, error) {
	var purchase models.Purchase
	var items []models.PurchaseItem

	if err := r.db.WithContext(ctx).First(&purchase, "id = ?", id).Error; err != nil {
		return nil, nil, err
	}

	if err := r.db.WithContext(ctx).Where("purchase_id = ?", id).Find(&items).Error; err != nil {
		return nil, nil, err
	}

	return &purchase, items, nil
}

func (r *purchaseRepository) List(ctx context.Context, departmentID *uuid.UUID, status string) ([]models.Purchase, error) {
	var purchases []models.Purchase
	query := r.db.WithContext(ctx)

	if departmentID != nil {
		query = query.Where("department_id = ?", *departmentID)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Order by created time (newest first). Assume simple default sort by ID for now, since autoCreateTime is not explicitly on Purchase model
	err := query.Order("id desc").Find(&purchases).Error
	if err != nil {
		return nil, err
	}

	return purchases, nil
}

func (r *purchaseRepository) UpdateStatusAndStep(ctx context.Context, tx *gorm.DB, purchaseID uuid.UUID, status string, stepID *uuid.UUID) error {
	db := r.db
	if tx != nil {
		db = tx
	}
	return db.WithContext(ctx).Model(&models.Purchase{}).Where("id = ?", purchaseID).Updates(map[string]interface{}{
		"status":          status,
		"current_step_id": stepID,
	}).Error
}

func (r *purchaseRepository) GetApprovalHistory(ctx context.Context, purchaseID uuid.UUID) ([]models.PurchaseApproval, error) {
	var history []models.PurchaseApproval
	err := r.db.WithContext(ctx).
		Where("purchase_id = ?", purchaseID).
		Order("acted_at asc").
		Find(&history).Error
	if err != nil {
		return nil, err
	}
	return history, nil
}

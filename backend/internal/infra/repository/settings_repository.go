package repository

import (
	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"
	"context"

	"gorm.io/gorm"
)

type systemSettingsRepository struct {
	db *gorm.DB
}

func NewSystemSettingsRepository(db *gorm.DB) domain.SystemSettingsRepository {
	return &systemSettingsRepository{db: db}
}

func (r *systemSettingsRepository) GetSettings(ctx context.Context) (*models.SystemSettings, error) {
	var settings models.SystemSettings
	// System settings id is typically 1 since there's only a single tenant
	err := r.db.WithContext(ctx).First(&settings, 1).Error
	if err != nil {
		return nil, err
	}
	return &settings, nil
}

func (r *systemSettingsRepository) UpdateSettings(ctx context.Context, settings *models.SystemSettings) error {
	return r.db.WithContext(ctx).Save(settings).Error
}

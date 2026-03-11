package service

import (
	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"
	"context"

	"gorm.io/datatypes"
)

type SettingsService interface {
	GetSettings(ctx context.Context) (*models.SystemSettings, error)
	GetThemeConfiguration(ctx context.Context) (datatypes.JSON, error)
	UpdateSettings(ctx context.Context, input models.SystemSettings) error
}

type settingsService struct {
	settingsRepo domain.SystemSettingsRepository
}

func NewSettingsService(repo domain.SystemSettingsRepository) SettingsService {
	return &settingsService{
		settingsRepo: repo,
	}
}

func (s *settingsService) GetThemeConfiguration(ctx context.Context) (datatypes.JSON, error) {
	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return nil, err
	}
	return settings.ThemeConfig, nil
}

func (s *settingsService) GetSettings(ctx context.Context) (*models.SystemSettings, error) {
	return s.settingsRepo.GetSettings(ctx)
}

func (s *settingsService) UpdateSettings(ctx context.Context, input models.SystemSettings) error {
	settings, err := s.settingsRepo.GetSettings(ctx)
	if err != nil {
		return err
	}

	if input.CompanyName != "" {
		settings.CompanyName = input.CompanyName
	}
	if input.Document != "" {
		settings.Document = input.Document
	}
	if input.ThemeConfig != nil {
		settings.ThemeConfig = input.ThemeConfig
	}

	return s.settingsRepo.UpdateSettings(ctx, settings)
}

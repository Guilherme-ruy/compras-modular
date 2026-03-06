package service

import (
	"compras-modular/backend/internal/core/domain"
	"context"

	"gorm.io/datatypes"
)

type SettingsService interface {
	GetThemeConfiguration(ctx context.Context) (datatypes.JSON, error)
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

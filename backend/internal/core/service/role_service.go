package service

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"
)

type RoleService interface {
	ListAll(ctx context.Context) ([]models.Role, error)
}

type roleService struct {
	repo domain.RoleRepository
}

func NewRoleService(repo domain.RoleRepository) RoleService {
	return &roleService{repo: repo}
}

func (s *roleService) ListAll(ctx context.Context) ([]models.Role, error) {
	return s.repo.FindAll(ctx)
}

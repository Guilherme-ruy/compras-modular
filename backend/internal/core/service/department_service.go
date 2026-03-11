package service

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"
)

type DepartmentService interface {
	ListAll(ctx context.Context) ([]models.Department, error)
	Create(ctx context.Context, name string) (*models.Department, error)
}

type departmentService struct {
	repo domain.DepartmentRepository
}

func NewDepartmentService(repo domain.DepartmentRepository) DepartmentService {
	return &departmentService{repo: repo}
}

func (s *departmentService) ListAll(ctx context.Context) ([]models.Department, error) {
	return s.repo.FindAll(ctx)
}

func (s *departmentService) Create(ctx context.Context, name string) (*models.Department, error) {
	dept := &models.Department{
		Name: name,
	}
	err := s.repo.Create(ctx, dept)
	if err != nil {
		return nil, err
	}
	return dept, nil
}

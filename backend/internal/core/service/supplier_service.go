package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
)

type SupplierService interface {
	ListAll(ctx context.Context, search string, status string) ([]models.Supplier, error)
	GetByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error)
	Create(ctx context.Context, supplier *models.Supplier) (*models.Supplier, error)
	Update(ctx context.Context, id uuid.UUID, updates *models.Supplier) (*models.Supplier, error)
	Delete(ctx context.Context, id uuid.UUID) error
	ToggleActive(ctx context.Context, id uuid.UUID) (*models.Supplier, error)
}

type supplierService struct {
	repo domain.SupplierRepository
}

func NewSupplierService(repo domain.SupplierRepository) SupplierService {
	return &supplierService{repo: repo}
}

func (s *supplierService) ListAll(ctx context.Context, search string, status string) ([]models.Supplier, error) {
	return s.repo.FindAll(ctx, search, status)
}

func (s *supplierService) GetByID(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *supplierService) Create(ctx context.Context, supplier *models.Supplier) (*models.Supplier, error) {
	if supplier.CompanyName == "" || supplier.CNPJ == "" {
		return nil, errors.New("a razão social e o CNPJ são obrigatórios")
	}

	supplier.IsActive = true
	if err := s.repo.Create(ctx, supplier); err != nil {
		return nil, err
	}
	return supplier, nil
}

func (s *supplierService) Update(ctx context.Context, id uuid.UUID, updates *models.Supplier) (*models.Supplier, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}

	if updates.CompanyName != "" {
		existing.CompanyName = updates.CompanyName
	}
	if updates.CNPJ != "" {
		existing.CNPJ = updates.CNPJ
	}
	existing.TradeName = updates.TradeName
	existing.StateReg = updates.StateReg
	existing.IsActive = updates.IsActive

	existing.ContactName = updates.ContactName
	existing.Phone = updates.Phone
	existing.Email = updates.Email
	existing.ComContact = updates.ComContact
	existing.FinContact = updates.FinContact

	existing.ZipCode = updates.ZipCode
	existing.Street = updates.Street
	existing.Number = updates.Number
	existing.Neighborhood = updates.Neighborhood
	existing.City = updates.City
	existing.State = updates.State

	existing.Bank = updates.Bank
	existing.Agency = updates.Agency
	existing.Account = updates.Account
	existing.Pix = updates.Pix

	existing.Notes = updates.Notes

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

func (s *supplierService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *supplierService) ToggleActive(ctx context.Context, id uuid.UUID) (*models.Supplier, error) {
	existing, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	existing.IsActive = !existing.IsActive
	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return existing, nil
}

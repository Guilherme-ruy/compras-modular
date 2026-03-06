package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"gorm.io/datatypes"
)

type PurchaseInput struct {
	TotalAmount float64
	Metadata    datatypes.JSON
	Items       []PurchaseItemInput
}

type PurchaseItemInput struct {
	Description string
	Quantity    float64
	UnitPrice   float64
}

type PurchaseResponse struct {
	Purchase models.Purchase       `json:"purchase"`
	Items    []models.PurchaseItem `json:"items"`
}

type PurchaseService interface {
	CreatePurchase(ctx context.Context, userID uuid.UUID, input PurchaseInput) (*models.Purchase, error)
	GetPurchaseByID(ctx context.Context, id uuid.UUID, userID uuid.UUID, roleName string) (*PurchaseResponse, error)
	ListPurchases(ctx context.Context, userID uuid.UUID, roleName string, statusFilter string) ([]models.Purchase, error)
}

type purchaseService struct {
	purchaseRepo domain.PurchaseRepository
	userRepo     domain.UserRepository
}

func NewPurchaseService(purchaseRepo domain.PurchaseRepository, userRepo domain.UserRepository) PurchaseService {
	return &purchaseService{
		purchaseRepo: purchaseRepo,
		userRepo:     userRepo,
	}
}

func (s *purchaseService) CreatePurchase(ctx context.Context, userID uuid.UUID, input PurchaseInput) (*models.Purchase, error) {
	// Lookup user to get department ID
	user, err := s.userRepo.FindByID(ctx, userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.DepartmentID == nil {
		return nil, errors.New("user does not belong to any department")
	}

	purchase := &models.Purchase{
		RequesterID:  user.ID,
		DepartmentID: *user.DepartmentID,
		TotalAmount:  input.TotalAmount,
		Status:       "DRAFT", // Hard requirement: starts as DRAFT
		Metadata:     input.Metadata,
	}

	var items []models.PurchaseItem
	for _, item := range input.Items {
		items = append(items, models.PurchaseItem{
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
		})
	}

	if err := s.purchaseRepo.Create(ctx, purchase, items); err != nil {
		return nil, err
	}

	return purchase, nil
}

func (s *purchaseService) GetPurchaseByID(ctx context.Context, id uuid.UUID, userID uuid.UUID, roleName string) (*PurchaseResponse, error) {
	purchase, items, err := s.purchaseRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("purchase not found")
	}

	// RBAC check: if requester, can only see their department's purchases
	if roleName == "REQUESTER" {
		user, err := s.userRepo.FindByID(ctx, userID)
		if err != nil {
			return nil, errors.New("user not found")
		}
		if user.DepartmentID == nil || *user.DepartmentID != purchase.DepartmentID {
			return nil, errors.New("unauthorized to view this purchase")
		}
	} // Viewer, Admin, Superadmin can view it

	return &PurchaseResponse{
		Purchase: *purchase,
		Items:    items,
	}, nil
}

func (s *purchaseService) ListPurchases(ctx context.Context, userID uuid.UUID, roleName string, statusFilter string) ([]models.Purchase, error) {
	var filterDeptID *uuid.UUID

	if roleName == "REQUESTER" {
		user, err := s.userRepo.FindByID(ctx, userID)
		if err != nil {
			return nil, errors.New("user not found")
		}
		if user.DepartmentID == nil {
			return []models.Purchase{}, nil
		}
		filterDeptID = user.DepartmentID
	}
	// For ADMIN, SUPERADMIN, VIEWER filterDeptID remains nil to fetch all

	purchases, err := s.purchaseRepo.List(ctx, filterDeptID, statusFilter)
	if err != nil {
		return nil, err
	}

	return purchases, nil
}

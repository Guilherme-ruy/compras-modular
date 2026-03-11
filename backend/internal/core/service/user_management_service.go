package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type UserInput struct {
	Name          string   `json:"name"`
	Email         string   `json:"email"`
	Password      string   `json:"password"`
	RoleID        string   `json:"role_id"`
	DepartmentIDs []string `json:"department_ids,omitempty"`
}

type UserManagementService interface {
	ListUsers(ctx context.Context) ([]models.User, error)
	CreateUser(ctx context.Context, input UserInput) (*models.User, error)
	UpdateUser(ctx context.Context, id uuid.UUID, input UserInput) (*models.User, error)
}

type userManagementService struct {
	userRepo domain.UserRepository
}

func NewUserManagementService(userRepo domain.UserRepository) UserManagementService {
	return &userManagementService{userRepo: userRepo}
}

func (s *userManagementService) ListUsers(ctx context.Context) ([]models.User, error) {
	return s.userRepo.FindAll(ctx)
}

func (s *userManagementService) CreateUser(ctx context.Context, input UserInput) (*models.User, error) {
	existing, _ := s.userRepo.FindByEmail(ctx, input.Email)
	if existing != nil {
		return nil, errors.New("user with this email already exists")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Name:         input.Name,
		Email:        input.Email,
		PasswordHash: string(hash),
		IsActive:     true,
	}

	if input.RoleID != "" {
		if err := user.RoleID.UnmarshalText([]byte(input.RoleID)); err != nil {
			return nil, errors.New("invalid role ID format")
		}
	} else {
		return nil, errors.New("role ID is required")
	}

	for _, dIDStr := range input.DepartmentIDs {
		var deptID uuid.UUID
		if err := deptID.UnmarshalText([]byte(dIDStr)); err != nil {
			return nil, errors.New("invalid department ID format: " + dIDStr)
		}
		var dept models.Department
		// Assuming we don't have direct access to debtRepo, we'll let GORM associate via nested struct if we attach the ID
		// Or we can just set the ID and GORM will create the Many2Many records
		dept.ID = deptID
		user.Departments = append(user.Departments, dept)
	}

	err = s.userRepo.Create(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (s *userManagementService) UpdateUser(ctx context.Context, id uuid.UUID, input UserInput) (*models.User, error) {
	user, err := s.userRepo.FindByID(ctx, id)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if input.Name != "" {
		user.Name = input.Name
	}
	
	if input.Email != "" && input.Email != user.Email {
		existing, _ := s.userRepo.FindByEmail(ctx, input.Email)
		if existing != nil {
			return nil, errors.New("email already in use")
		}
		user.Email = input.Email
	}

	if input.Password != "" {
		hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.PasswordHash = string(hash)
	}

	err = s.userRepo.Update(ctx, user)
	if err != nil {
		return nil, err
	}

	return user, nil
}

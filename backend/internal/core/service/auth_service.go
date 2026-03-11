package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/pkg/auth"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Login(ctx context.Context, email, password string) (string, []byte, error)
}

type authService struct {
	userRepo domain.UserRepository
	roleRepo domain.RoleRepository
}

func NewAuthService(userRepo domain.UserRepository, roleRepo domain.RoleRepository) AuthService {
	return &authService{
		userRepo: userRepo,
		roleRepo: roleRepo,
	}
}

func (s *authService) Login(ctx context.Context, email, password string) (string, []byte, error) {
	user, err := s.userRepo.FindByEmail(ctx, email)
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	if !user.IsActive {
		return "", nil, errors.New("user is not active")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", nil, errors.New("invalid credentials")
	}

	role, err := s.roleRepo.FindByID(ctx, user.RoleID)
	if err != nil {
		return "", nil, errors.New("failed to retrieve user role")
	}

	var deptIDs []uuid.UUID
	for _, dept := range user.Departments {
		deptIDs = append(deptIDs, dept.ID)
	}

	token, err := auth.GenerateToken(user.ID, role.ID, role.Name, deptIDs)
	if err != nil {
		return "", nil, err
	}

	return token, role.Permissions, nil
}

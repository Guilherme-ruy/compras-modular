package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/http/middlewares"
	"compras-modular/backend/pkg/auth"
)

type UserManagementHandler struct {
	userService service.UserManagementService
}

func NewUserManagementHandler(s service.UserManagementService) *UserManagementHandler {
	return &UserManagementHandler{userService: s}
}

func (h *UserManagementHandler) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.userService.ListUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Omit password hashes before sending
	for i := range users {
		users[i].PasswordHash = ""
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (h *UserManagementHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input service.UserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	user, err := h.userService.CreateUser(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user.PasswordHash = "" // Never return the hash
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *UserManagementHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	// Only allow updating own profile for now in this route
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var input service.UserInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	updatedUser, err := h.userService.UpdateUser(r.Context(), userClaims.UserID, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updatedUser.PasswordHash = ""
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedUser)
}

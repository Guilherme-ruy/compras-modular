package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
)

type RoleHandler struct {
	roleService service.RoleService
}

func NewRoleHandler(s service.RoleService) *RoleHandler {
	return &RoleHandler{roleService: s}
}

func (h *RoleHandler) List(w http.ResponseWriter, r *http.Request) {
	roles, err := h.roleService.ListAll(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}

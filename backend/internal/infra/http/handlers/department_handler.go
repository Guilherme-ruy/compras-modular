package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
)

type DepartmentHandler struct {
	departmentService service.DepartmentService
}

func NewDepartmentHandler(deptService service.DepartmentService) *DepartmentHandler {
	return &DepartmentHandler{departmentService: deptService}
}

func (h *DepartmentHandler) List(w http.ResponseWriter, r *http.Request) {
	departments, err := h.departmentService.ListAll(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(departments)
}

func (h *DepartmentHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if input.Name == "" {
		http.Error(w, "Department name is required", http.StatusBadRequest)
		return
	}

	dept, err := h.departmentService.Create(r.Context(), input.Name)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(dept)
}

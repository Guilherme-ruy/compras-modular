package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/http/middlewares"
	"compras-modular/backend/pkg/auth"
)

type DashboardHandler struct {
	dashboardSvc service.DashboardService
}

func NewDashboardHandler(dashboardSvc service.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		dashboardSvc: dashboardSvc,
	}
}

func (h *DashboardHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	metrics, err := h.dashboardSvc.GetMetrics(r.Context(), userClaims.UserID, userClaims.RoleName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

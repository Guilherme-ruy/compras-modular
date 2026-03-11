package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/http/middlewares"
	"compras-modular/backend/internal/infra/models"
	"compras-modular/backend/pkg/auth"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type WorkflowHandler struct {
	workflowService service.WorkflowService
	userRepo        interface {
		FindByID(ctx context.Context, id uuid.UUID) (*models.User, error)
	} // Since we need user's roleID we can fetch the user or add roleID to JWT.
	// Let's use the core auth setup to grab RoleID.
}

func NewWorkflowHandler(workflowService service.WorkflowService) *WorkflowHandler {
	return &WorkflowHandler{
		workflowService: workflowService,
	}
}

// Since JWT doesn't have RoleID, only RoleName, we'd need it.
// Let's just create a helper struct to parse request
type ActionRequest struct {
	Comments string `json:"comments"`
}

func (h *WorkflowHandler) Submit(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	purchaseID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid purchase ID", http.StatusBadRequest)
		return
	}

	if err := h.workflowService.SubmitPurchase(r.Context(), purchaseID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Purchase submitted for approval"}`))
}

func (h *WorkflowHandler) Approve(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := chi.URLParam(r, "id")
	purchaseID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid purchase ID", http.StatusBadRequest)
		return
	}

	var req ActionRequest
	json.NewDecoder(r.Body).Decode(&req)

	// We'll rely on the handler's access to the user through UserID for now.
	roleID := userClaims.RoleID

	if err := h.workflowService.ApprovePurchase(r.Context(), purchaseID, userClaims.UserID, roleID, req.Comments); err != nil {
		if strings.Contains(err.Error(), "403 Forbidden") {
			http.Error(w, err.Error(), http.StatusForbidden)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Purchase approved"}`))
}

func (h *WorkflowHandler) Reject(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	idStr := chi.URLParam(r, "id")
	purchaseID, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid purchase ID", http.StatusBadRequest)
		return
	}

	var req ActionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Comments == "" {
		http.Error(w, "Comments are required for rejection", http.StatusBadRequest)
		return
	}

	roleID := userClaims.RoleID

	if err := h.workflowService.RejectPurchase(r.Context(), purchaseID, userClaims.UserID, roleID, req.Comments); err != nil {
		if strings.Contains(err.Error(), "403 Forbidden") {
			http.Error(w, err.Error(), http.StatusForbidden)
		} else {
			http.Error(w, err.Error(), http.StatusBadRequest)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"message": "Purchase rejected"}`))
}

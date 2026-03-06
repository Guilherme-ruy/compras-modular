package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
	"compras-modular/backend/internal/infra/http/middlewares"
	"compras-modular/backend/pkg/auth"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type PurchaseHandler struct {
	purchaseService service.PurchaseService
}

func NewPurchaseHandler(purchaseService service.PurchaseService) *PurchaseHandler {
	return &PurchaseHandler{purchaseService: purchaseService}
}

func (h *PurchaseHandler) Create(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req service.PurchaseInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	purchase, err := h.purchaseService.CreatePurchase(r.Context(), userClaims.UserID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(purchase)
}

func (h *PurchaseHandler) List(w http.ResponseWriter, r *http.Request) {
	userClaims, ok := r.Context().Value(middlewares.UserContextKey).(*auth.Claims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	statusFilter := r.URL.Query().Get("status")

	purchases, err := h.purchaseService.ListPurchases(r.Context(), userClaims.UserID, userClaims.RoleName, statusFilter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchases)
}

func (h *PurchaseHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	purchaseResponse, err := h.purchaseService.GetPurchaseByID(r.Context(), purchaseID, userClaims.UserID, userClaims.RoleName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(purchaseResponse)
}

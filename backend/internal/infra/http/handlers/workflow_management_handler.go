package handlers

import (
	"encoding/json"
	"net/http"

	"compras-modular/backend/internal/core/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type WorkflowManagementHandler struct {
	workflowMgmtSvc service.WorkflowManagementService
}

func NewWorkflowManagementHandler(workflowMgmtSvc service.WorkflowManagementService) *WorkflowManagementHandler {
	return &WorkflowManagementHandler{
		workflowMgmtSvc: workflowMgmtSvc,
	}
}

func (h *WorkflowManagementHandler) List(w http.ResponseWriter, r *http.Request) {
	workflows, err := h.workflowMgmtSvc.ListWorkflows(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workflows)
}

func (h *WorkflowManagementHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input service.WorkflowManagementInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	workflow, err := h.workflowMgmtSvc.CreateWorkflow(r.Context(), input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(workflow)
}

func (h *WorkflowManagementHandler) Update(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid workflow ID", http.StatusBadRequest)
		return
	}

	var input service.WorkflowManagementInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	workflow, err := h.workflowMgmtSvc.UpdateWorkflow(r.Context(), id, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(workflow)
}

func (h *WorkflowManagementHandler) Delete(w http.ResponseWriter, r *http.Request) {
	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		http.Error(w, "Invalid workflow ID", http.StatusBadRequest)
		return
	}

	if err := h.workflowMgmtSvc.DeleteWorkflow(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

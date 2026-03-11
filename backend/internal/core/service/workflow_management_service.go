package service

import (
	"context"
	"errors"

	"compras-modular/backend/internal/core/domain"
	"compras-modular/backend/internal/infra/models"

	"github.com/google/uuid"
)

type WorkflowManagementInput struct {
	DepartmentID uuid.UUID           `json:"department_id"`
	MinAmount    float64             `json:"min_amount"`
	Steps        []WorkflowStepInput `json:"steps"`
}

type WorkflowStepInput struct {
	StepOrder      int        `json:"step_order"`
	ApproverRoleID *uuid.UUID `json:"approver_role_id"`
	ApproverUserID *uuid.UUID `json:"approver_user_id"`
}

type WorkflowResponse struct {
	Workflow models.ApprovalWorkflow `json:"workflow"`
	Steps    []models.WorkflowStep   `json:"steps"`
}

type WorkflowManagementService interface {
	ListWorkflows(ctx context.Context) ([]WorkflowResponse, error)
	CreateWorkflow(ctx context.Context, input WorkflowManagementInput) (*WorkflowResponse, error)
	UpdateWorkflow(ctx context.Context, id uuid.UUID, input WorkflowManagementInput) (*WorkflowResponse, error)
	DeleteWorkflow(ctx context.Context, id uuid.UUID) error
}

type workflowManagementService struct {
	workflowRepo domain.WorkflowRepository
}

func NewWorkflowManagementService(workflowRepo domain.WorkflowRepository) WorkflowManagementService {
	return &workflowManagementService{
		workflowRepo: workflowRepo,
	}
}

func (s *workflowManagementService) ListWorkflows(ctx context.Context) ([]WorkflowResponse, error) {
	workflows, err := s.workflowRepo.FindAll(ctx)
	if err != nil {
		return nil, err
	}

	var res []WorkflowResponse
	for _, w := range workflows {
		steps, _ := s.workflowRepo.FindStepsByWorkflowID(ctx, w.ID)
		res = append(res, WorkflowResponse{
			Workflow: w,
			Steps:    steps,
		})
	}
	return res, nil
}

func (s *workflowManagementService) CreateWorkflow(ctx context.Context, input WorkflowManagementInput) (*WorkflowResponse, error) {
	workflow := &models.ApprovalWorkflow{
		DepartmentID: input.DepartmentID,
		MinAmount:    input.MinAmount,
	}

	if err := s.workflowRepo.CreateWorkflow(ctx, workflow); err != nil {
		return nil, err
	}

	var steps []models.WorkflowStep
	for _, st := range input.Steps {
		step := models.WorkflowStep{
			WorkflowID:     workflow.ID,
			StepOrder:      st.StepOrder,
			ApproverRoleID: st.ApproverRoleID,
			ApproverUserID: st.ApproverUserID,
		}
		if err := s.workflowRepo.CreateStep(ctx, &step); err != nil {
			return nil, err
		}
		steps = append(steps, step)
	}

	return &WorkflowResponse{Workflow: *workflow, Steps: steps}, nil
}

func (s *workflowManagementService) UpdateWorkflow(ctx context.Context, id uuid.UUID, input WorkflowManagementInput) (*WorkflowResponse, error) {
	// Let's assume the entity is found via some direct query (for safety we just update it)
	workflow := &models.ApprovalWorkflow{
		ID:           id,
		DepartmentID: input.DepartmentID,
		MinAmount:    input.MinAmount,
	}

	if err := s.workflowRepo.UpdateWorkflow(ctx, workflow); err != nil {
		return nil, err
	}

	var newSteps []models.WorkflowStep
	for _, st := range input.Steps {
		newSteps = append(newSteps, models.WorkflowStep{
			WorkflowID:     workflow.ID,
			StepOrder:      st.StepOrder,
			ApproverRoleID: st.ApproverRoleID,
			ApproverUserID: st.ApproverUserID,
		})
	}

	if err := s.workflowRepo.ReplaceSteps(ctx, id, newSteps); err != nil {
		return nil, err
	}

	steps, _ := s.workflowRepo.FindStepsByWorkflowID(ctx, id)

	return &WorkflowResponse{Workflow: *workflow, Steps: steps}, nil
}

func (s *workflowManagementService) DeleteWorkflow(ctx context.Context, id uuid.UUID) error {
	if id == uuid.Nil {
		return errors.New("invalid id")
	}
	return s.workflowRepo.DeleteWorkflow(ctx, id)
}

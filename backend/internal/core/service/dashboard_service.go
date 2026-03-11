package service

import (
	"context"

	"compras-modular/backend/internal/core/domain"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DashboardMetricsResponse struct {
	TotalApprovedAmount   float64                   `json:"total_approved_amount"`
	PendingPurchasesCount int64                     `json:"pending_purchases_count"`
	PurchasesThisMonth    int64                     `json:"purchases_this_month"`
	RejectedThisMonth     int64                     `json:"rejected_this_month"`
	SpendByDepartment     []SpendByDepartmentMetric `json:"spend_by_department"`
}

type SpendByDepartmentMetric struct {
	DepartmentName string  `json:"department_name"`
	Amount         float64 `json:"amount"`
}

type DashboardService interface {
	GetMetrics(ctx context.Context, userID uuid.UUID, roleName string) (*DashboardMetricsResponse, error)
}

type dashboardService struct {
	db       *gorm.DB
	userRepo domain.UserRepository
}

func NewDashboardService(db *gorm.DB, userRepo domain.UserRepository) DashboardService {
	return &dashboardService{
		db:       db,
		userRepo: userRepo,
	}
}

func (s *dashboardService) GetMetrics(ctx context.Context, userID uuid.UUID, roleName string) (*DashboardMetricsResponse, error) {
	var filterDeptIDs []uuid.UUID

	if roleName != "SUPERADMIN" && roleName != "ADMIN" {
		user, err := s.userRepo.FindByID(ctx, userID)
		if err != nil {
			return nil, err
		}
		for _, d := range user.Departments {
			filterDeptIDs = append(filterDeptIDs, d.ID)
		}
		if len(filterDeptIDs) == 0 {
			// No departments assigned, return zeroed metrics
			return &DashboardMetricsResponse{
				SpendByDepartment: []SpendByDepartmentMetric{},
			}, nil
		}
	}

	var res DashboardMetricsResponse

	// Base query builder for purchases
	baseQuery := func() *gorm.DB {
		q := s.db.WithContext(ctx).Table("purchases")
		if len(filterDeptIDs) > 0 {
			q = q.Where("department_id IN ?", filterDeptIDs)
		}
		return q
	}

	// 1. Total Approved Amount
	baseQuery().Where("status = ?", "APPROVED").Select("COALESCE(SUM(total_amount), 0)").Scan(&res.TotalApprovedAmount)

	// 2. Pending Purchases Count
	baseQuery().Where("status = ?", "PENDING_APPROVAL").Count(&res.PendingPurchasesCount)

	// 3. Purchases This Month (Any status) - PostgreSQL syntax 
	baseQuery().Where("EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)").Count(&res.PurchasesThisMonth)

	// 4. Rejected This Month
	baseQuery().Where("status = ?", "REJECTED").Where("EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)").Count(&res.RejectedThisMonth)

	// 5. Spend By Department (Approved only)
	var spendList []struct {
		DepartmentName string
		Amount         float64
	}
	
	// Join with departments to get the name
	qSpend := s.db.WithContext(ctx).Table("purchases p").
		Select("d.name as department_name, COALESCE(SUM(p.total_amount), 0) as amount").
		Joins("JOIN departments d ON d.id = p.department_id").
		Where("p.status = ?", "APPROVED")
		
	if len(filterDeptIDs) > 0 {
		qSpend = qSpend.Where("p.department_id IN ?", filterDeptIDs)
	}
	
	qSpend.Group("d.name").Scan(&spendList)

	for _, g := range spendList {
		res.SpendByDepartment = append(res.SpendByDepartment, SpendByDepartmentMetric{
			DepartmentName: g.DepartmentName,
			Amount:         g.Amount,
		})
	}

	if res.SpendByDepartment == nil {
		res.SpendByDepartment = []SpendByDepartmentMetric{}
	}

	return &res, nil
}

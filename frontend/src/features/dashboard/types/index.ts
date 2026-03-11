export interface SpendByDepartment {
    department_name: string;
    amount: number;
}

export interface DashboardMetrics {
    total_approved_amount: number;
    pending_purchases_count: number;
    purchases_this_month: number;
    rejected_this_month: number;
    spend_by_department: SpendByDepartment[];
}

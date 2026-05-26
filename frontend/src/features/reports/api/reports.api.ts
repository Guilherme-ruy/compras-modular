import api from '../../../services/api';
import type { ExportPurchase, ReportFilters } from '../types';

export async function fetchReportData(filters: ReportFilters): Promise<ExportPurchase[]> {
  const params = new URLSearchParams();
  if (filters.startDate)    params.set('startDate',    filters.startDate);
  if (filters.endDate)      params.set('endDate',      filters.endDate);
  if (filters.status)       params.set('status',       filters.status);
  if (filters.departmentId) params.set('departmentId', filters.departmentId);
  if (filters.supplierId)   params.set('supplierId',   filters.supplierId);
  if (filters.search)       params.set('search',       filters.search.trim());

  const res = await api.get<ExportPurchase[]>(`/purchases/export?${params.toString()}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchDepartmentsForReport(): Promise<{ id: string; name: string }[]> {
  const res = await api.get('/departments');
  const payload = Array.isArray(res.data) ? res.data : res.data?.data;
  return Array.isArray(payload) ? payload : [];
}

export async function fetchSuppliersForReport(): Promise<{ id: string; companyName: string }[]> {
  const res = await api.get('/suppliers?perPage=500');
  const payload = Array.isArray(res.data) ? res.data : res.data?.data;
  return Array.isArray(payload) ? payload : [];
}

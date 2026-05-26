export type ReportSection = 'summary' | 'items' | 'approvals';

export type ColumnDef = {
  id: string;
  label: string;
  section: ReportSection;
};

export type ExportPurchase = {
  id: string;
  number: number;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  metadata: { notes?: string } | null;
  requester: { name: string };
  department: { name: string };
  supplier: { companyName: string; document: string } | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number | string;
    link: string;
    category: { name: string; parent: { name: string } | null } | null;
  }>;
  approvals: Array<{
    action: string;
    comments: string;
    actedAt: string;
    actor: { name: string };
    step: { stepOrder: number } | null;
  }>;
};

export type ReportFilters = {
  startDate: string;
  endDate: string;
  status: string;
  departmentId: string;
  supplierId: string;
  search: string;
};

export const ALL_COLUMNS: ColumnDef[] = [
  { id: 'number',           label: 'Nº Pedido',         section: 'summary' },
  { id: 'createdAt',        label: 'Data de Criação',    section: 'summary' },
  { id: 'status',           label: 'Status',             section: 'summary' },
  { id: 'requester',        label: 'Solicitante',        section: 'summary' },
  { id: 'department',       label: 'Departamento',       section: 'summary' },
  { id: 'supplier',         label: 'Fornecedor',         section: 'summary' },
  { id: 'supplierDocument', label: 'CNPJ Fornecedor',    section: 'summary' },
  { id: 'totalAmount',      label: 'Valor Total',        section: 'summary' },
  { id: 'notes',            label: 'Observações',        section: 'summary' },
  { id: 'itemDescription',  label: 'Descrição do Item',  section: 'items' },
  { id: 'itemQuantity',     label: 'Quantidade',         section: 'items' },
  { id: 'itemUnitPrice',    label: 'Preço Unitário',     section: 'items' },
  { id: 'itemSubtotal',     label: 'Subtotal do Item',   section: 'items' },
  { id: 'itemCategory',     label: 'Categoria',          section: 'items' },
  { id: 'itemLink',         label: 'Link',               section: 'items' },
  { id: 'approvalAction',   label: 'Ação de Aprovação',  section: 'approvals' },
  { id: 'approvalActor',    label: 'Aprovador',          section: 'approvals' },
  { id: 'approvalComments', label: 'Comentário',         section: 'approvals' },
  { id: 'approvalDate',     label: 'Data da Aprovação',  section: 'approvals' },
];

export const DEFAULT_SELECTED_IDS = [
  'number', 'createdAt', 'status', 'requester', 'department', 'supplier', 'totalAmount',
];

export const SECTION_LABELS: Record<ReportSection, string> = {
  summary:   'Resumo do Pedido',
  items:     'Itens de Compra',
  approvals: 'Histórico de Aprovações',
};

export const ApprovalActionLabels: Record<string, string> = {
  SUBMITTED:                  'Submetido',
  APPROVED:                   'Aprovado',
  REJECTED:                   'Rejeitado',
  CLOSED:                     'Fechado',
  POST_CLOSE_DOCUMENTS_ADDED: 'Documentos Pós-Fechamento',
};

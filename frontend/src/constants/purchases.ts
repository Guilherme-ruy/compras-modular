export const PurchaseStatus = {
    DRAFT: 'DRAFT',
    AWAITING_QUOTES: 'AWAITING_QUOTES',
    PENDING_APPROVAL: 'PENDING_APPROVAL',
    PENDING_CLOSING: 'PENDING_CLOSING',
    APPROVED: 'APPROVED',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
} as const;

export const PurchaseStatusLabels: Record<string, string> = {
    [PurchaseStatus.DRAFT]: 'Rascunho',
    [PurchaseStatus.AWAITING_QUOTES]: 'Aguardando Cotações',
    [PurchaseStatus.PENDING_APPROVAL]: 'Em Aprovação',
    [PurchaseStatus.PENDING_CLOSING]: 'Aguardando Fechamento',
    [PurchaseStatus.APPROVED]: 'Aprovado',
    [PurchaseStatus.COMPLETED]: 'Concluído',
    [PurchaseStatus.REJECTED]: 'Rejeitado'
};

export const PurchaseStatusColors: Record<string, string> = {
    [PurchaseStatus.DRAFT]: 'bg-slate-100 text-slate-800',
    [PurchaseStatus.AWAITING_QUOTES]: 'bg-sky-100 text-sky-800',
    [PurchaseStatus.PENDING_APPROVAL]: 'bg-amber-100 text-amber-800',
    [PurchaseStatus.PENDING_CLOSING]: 'bg-purple-100 text-purple-800',
    [PurchaseStatus.APPROVED]: 'bg-emerald-100 text-emerald-800',
    [PurchaseStatus.COMPLETED]: 'bg-indigo-100 text-indigo-800',
    [PurchaseStatus.REJECTED]: 'bg-red-100 text-red-800'
};

export const SupplierStatus = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    BLOCKED: 'BLOCKED'
} as const;

export const SupplierStatusLabels: Record<string, string> = {
    [SupplierStatus.ACTIVE]: 'Ativo',
    [SupplierStatus.INACTIVE]: 'Inativo',
    [SupplierStatus.BLOCKED]: 'Bloqueado'
};

export const SupplierStatusColors: Record<string, string> = {
    [SupplierStatus.ACTIVE]: 'bg-emerald-100 text-emerald-800',
    [SupplierStatus.INACTIVE]: 'bg-slate-100 text-slate-800',
    [SupplierStatus.BLOCKED]: 'bg-red-100 text-red-800'
};

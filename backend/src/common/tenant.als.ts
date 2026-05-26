import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContext {
  tenantId: string;
}

export const tenantAls = new AsyncLocalStorage<TenantContext>();

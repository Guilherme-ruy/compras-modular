import { Injectable } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';

export type NotificationType =
  | 'PURCHASE_SUBMITTED'
  | 'PURCHASE_APPROVED_STEP'
  | 'PURCHASE_APPROVED_FINAL'
  | 'PURCHASE_REJECTED'
  | 'PURCHASE_PENDING_CLOSING'
  | 'PURCHASE_COMPLETED';

const TITLES: Record<NotificationType, string> = {
  PURCHASE_SUBMITTED: 'Novo pedido aguardando aprovação',
  PURCHASE_APPROVED_STEP: 'Pedido avançou para próxima etapa',
  PURCHASE_APPROVED_FINAL: 'Pedido aprovado!',
  PURCHASE_REJECTED: 'Pedido rejeitado',
  PURCHASE_PENDING_CLOSING: 'Pedido aguardando fechamento',
  PURCHASE_COMPLETED: 'Pedido concluído!',
};

@Injectable()
export class NotificationsService {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  /**
   * Cria notificações para múltiplos usuários.
   * tx = transação Prisma opcional (chamada dentro de $transaction).
   */
  async notify(
    userIds: string[],
    type: NotificationType,
    body: string,
    purchaseId?: string,
    tx?: any,
  ) {
    const unique = [...new Set(userIds.filter(Boolean))];
    if (unique.length === 0) return;
    const notifications = unique.map((userId) => ({
      userId,
      type,
      title: TITLES[type],
      body,
      purchaseId,
    }));
    await this.notificationsRepository.createMany(notifications, tx);
  }

  async findByUser(userId: string) {
    return this.notificationsRepository.findByUser(userId);
  }

  async countUnread(userId: string) {
    return this.notificationsRepository.countUnread(userId);
  }

  async markRead(id: string, userId: string) {
    return this.notificationsRepository.markRead(id, userId);
  }

  async markAllRead(userId: string) {
    return this.notificationsRepository.markAllRead(userId);
  }
}

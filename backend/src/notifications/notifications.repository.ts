import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    notifications: Array<{
      userId: string;
      type: string;
      title: string;
      body: string;
      purchaseId?: string;
    }>,
    tx?: any,
  ) {
    const client = tx ?? this.prisma;
    if (notifications.length === 0) return;
    await client.notification.createMany({ data: notifications });
  }

  async findByUser(userId: string, limit = 15) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        purchase: { select: { id: true, number: true } },
      },
    });
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

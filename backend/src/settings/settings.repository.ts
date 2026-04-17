import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSettings() {
    return this.prisma.systemSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { companyName: 'Compras Modular', document: '', themeConfig: {} },
    });
  }

  updateSettings(data: { companyName?: string; document?: string; themeConfig?: object }) {
    return this.prisma.systemSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        companyName: data.companyName ?? 'Compras Modular',
        document: data.document ?? '',
        themeConfig: data.themeConfig ?? {},
      },
    });
  }
}

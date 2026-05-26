import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  getSettings() {
    return this.prisma.systemSettings.upsert({
      where: { tenantId: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: { tenantId: '00000000-0000-0000-0000-000000000000', companyName: 'Compras Modular', document: '', themeConfig: {} },
    });
  }

  async updateSettings(data: { companyName?: string; document?: string; themeConfig?: any }) {
    const current = await this.getSettings();
    const newThemeConfig = data.themeConfig 
      ? { ...(typeof current.themeConfig === 'object' && current.themeConfig ? current.themeConfig : {}), ...data.themeConfig }
      : current.themeConfig;

    return this.prisma.systemSettings.upsert({
      where: { tenantId: '00000000-0000-0000-0000-000000000000' },
      update: {
        companyName: data.companyName,
        document: data.document,
        themeConfig: newThemeConfig,
      },
      create: {
        tenantId: '00000000-0000-0000-0000-000000000000',
        companyName: data.companyName ?? 'Compras Modular',
        document: data.document ?? '',
        themeConfig: newThemeConfig ?? {},
      },
    });
  }
}

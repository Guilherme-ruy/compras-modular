import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { UpdateSettingsDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  getSettings() {
    return this.settingsRepository.getSettings();
  }

  async getTheme() {
    const settings = await this.settingsRepository.getSettings();
    return { themeConfig: settings.themeConfig, companyName: settings.companyName };
  }

  updateSettings(dto: UpdateSettingsDto) {
    return this.settingsRepository.updateSettings(dto);
  }
}

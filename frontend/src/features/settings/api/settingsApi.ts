import api from '../../../services/api';
import type { SystemSettings, UserProfileUpdate } from '../types';

export const settingsApi = {
    // Current User Profile
    updateProfile: async (data: UserProfileUpdate): Promise<void> => {
        await api.put('/users/profile', data);
    },

    // System Settings (Company + Theme)
    getSystemSettings: async (): Promise<SystemSettings> => {
        const response = await api.get<SystemSettings>('/settings');
        return response.data;
    },

    updateSystemSettings: async (settings: Partial<SystemSettings>): Promise<void> => {
        await api.put('/settings', settings);
    }
};

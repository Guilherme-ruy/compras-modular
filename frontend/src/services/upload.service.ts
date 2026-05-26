import api from './api';

export interface UploadResult {
  url: string;
  key: string;
  name: string;
}

export const uploadService = {
  async uploadFile(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<UploadResult>('/uploads', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
};

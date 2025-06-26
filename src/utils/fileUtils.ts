import type { FileAttachment } from '../types/agent';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'application/pdf',
  'application/json',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
};

export const validateFile = (file: File): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return `ファイルサイズが大きすぎます。最大${MAX_FILE_SIZE / 1024 / 1024}MBまでです。`;
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return `サポートされていないファイル形式です。`;
  }

  return null;
};

export const createFileAttachment = async (file: File): Promise<FileAttachment> => {
  const validationError = validateFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const base64Data = await fileToBase64(file);

  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    data: base64Data,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Paperclip } from 'lucide-react';
import type { FileAttachment } from '../types/agent';
import { formatFileSize, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../utils/fileUtils';

interface FileUploadProps {
  attachments: FileAttachment[];
  onFilesAdded: (files: FileAttachment[]) => void;
  onFileRemoved: (fileId: string) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onFilesAdded,
  onFileRemoved,
  disabled = false,
}) => {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled) return;

      const newAttachments: FileAttachment[] = [];
      
      for (const file of acceptedFiles) {
        try {
          const { createFileAttachment } = await import('../utils/fileUtils');
          const attachment = await createFileAttachment(file);
          newAttachments.push(attachment);
        } catch (error) {
          console.error('ファイル処理エラー:', error);
          alert(`ファイル "${file.name}" の処理中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (newAttachments.length > 0) {
        onFilesAdded(newAttachments);
      }
    },
    [onFilesAdded, disabled]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_FILE_TYPES.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: MAX_FILE_SIZE,
    disabled,
  });

  return (
    <div className="space-y-3">
      {/* ファイルドロップエリア */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-8 w-8 mb-2 ${disabled ? 'text-gray-300' : 'text-gray-400'}`} />
        <p className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
          {isDragActive
            ? 'ファイルをドロップしてください'
            : 'ファイルをドラッグ&ドロップするか、クリックして選択'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          最大{MAX_FILE_SIZE / 1024 / 1024}MB / PDF, Word, Excel, 画像, テキストファイル
        </p>
      </div>

      {/* 添付ファイル一覧 */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            添付ファイル ({attachments.length})
          </h4>
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Paperclip className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFileRemoved(attachment.id)}
                disabled={disabled}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="ファイルを削除"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

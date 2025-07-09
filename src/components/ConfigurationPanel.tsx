import React, { useState } from 'react';
import { Settings, Save, Eye, EyeOff, RefreshCw, Check, AlertCircle } from 'lucide-react';
import type { AzureConfig } from '../hooks/useAzureConfig';

interface ConfigurationPanelProps {
  config: AzureConfig | null;
  onSave: (config: AzureConfig) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  config,
  onSave,
  onCancel,
  isOpen,
}) => {
  const [formData, setFormData] = useState<AzureConfig>({
    endpoint: config?.endpoint || '',
    apiKey: config?.apiKey || '',
    agentId: config?.agentId || '',
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [errors, setErrors] = useState<Partial<AzureConfig>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<AzureConfig> = {};

    if (!formData.endpoint.trim()) {
      newErrors.endpoint = 'エンドポイントURLは必須です';
    } else if (!isValidUrl(formData.endpoint)) {
      newErrors.endpoint = '有効なURLを入力してください';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'APIキーは必須です';
    }

    if (!formData.agentId.trim()) {
      newErrors.agentId = 'Agent IDは必須です';
    } else if (!formData.agentId.startsWith('asst_')) {
      newErrors.agentId = 'Agent IDは "asst_" で始まる必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      setTestResult({ success: false, message: 'フォームの入力を確認してください' });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      // Azure AI Foundryの認証ヘッダーを準備
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Azure-AI-Foundry-Chat-UI/1.0'
      };

      // API Keyの形式に応じて認証ヘッダーを設定
      if (formData.apiKey.startsWith('Bearer ')) {
        headers['Authorization'] = formData.apiKey;
      } else if (formData.apiKey.includes('.') && formData.apiKey.length > 100) {
        // JWTトークンの場合
        headers['Authorization'] = `Bearer ${formData.apiKey}`;
      } else if (formData.apiKey.startsWith('sk-')) {
        // OpenAI形式のAPIキーの場合
        headers['Authorization'] = `Bearer ${formData.apiKey}`;
      } else {
        // Azure AI Foundry固有のAPIキーの場合
        headers['api-key'] = formData.apiKey;
        headers['Authorization'] = `Bearer ${formData.apiKey}`;
      }

      // エージェントの存在確認を試行
      const agentResponse = await fetch(`${formData.endpoint}/assistants/${formData.agentId}?api-version=v1`, {
        method: 'GET',
        headers,
      });

      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        setTestResult({ 
          success: true, 
          message: `接続テストに成功しました。エージェント: ${agentData.name || formData.agentId}` 
        });
      } else {
        let errorMessage = `接続エラー: ${agentResponse.status}`;
        
        try {
          const errorData = await agentResponse.json();
          if (errorData.error?.message) {
            errorMessage += ` - ${errorData.error.message}`;
          } else if (errorData.message) {
            errorMessage += ` - ${errorData.message}`;
          }
        } catch {
          // JSONパースエラーの場合はステータステキストを使用
          errorMessage += ` - ${agentResponse.statusText}`;
        }

        // 認証エラーの場合は具体的なアドバイスを提供
        if (agentResponse.status === 401) {
          errorMessage += '\n\n💡 認証エラーの解決方法:\n';
          errorMessage += '• APIキーが正しいことを確認してください\n';
          errorMessage += '• Azure AI StudioからAPIキーを再生成してみてください\n';
          errorMessage += '• エンドポイントURLが正しいことを確認してください';
        }

        setTestResult({ success: false, message: errorMessage });
      }
    } catch (error) {
      let errorMessage = `接続エラー: ${error instanceof Error ? error.message : '不明なエラー'}`;
      
      // ネットワークエラーの場合
      if (error instanceof Error && error.message.includes('fetch')) {
        errorMessage += '\n\n💡 解決方法:\n';
        errorMessage += '• エンドポイントURLが正しいことを確認してください\n';
        errorMessage += '• インターネット接続を確認してください\n';
        errorMessage += '• CORSの設定を確認してください';
      }
      
      setTestResult({ success: false, message: errorMessage });
    } finally {
      setIsTestingConnection(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Azure AI Foundry Agent 設定</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Endpoint URL */}
            <div>
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-2">
                エンドポイントURL
              </label>
              <input
                type="url"
                id="endpoint"
                value={formData.endpoint}
                onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                placeholder="https://[YOUR_AIFOUNDRY].services.ai.azure.com/api/projects/[YOURPROJECT]"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.endpoint ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endpoint && (
                <p className="mt-1 text-sm text-red-600">{errors.endpoint}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Azure AI FoundryプロジェクトのエンドポイントURLを入力してください
              </p>
            </div>

            {/* API Key */}
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                APIキー
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="APIキーまたはAzure認証トークンを入力"
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.apiKey ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showApiKey ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {errors.apiKey && (
                <p className="mt-1 text-sm text-red-600">{errors.apiKey}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Azure AI FoundryのAPIキーまたはAzure認証トークンを入力してください
                <br />
                <span className="text-blue-600">ヒント: Azure CLIで取得する場合: az account get-access-token --scope https://ml.azure.com</span>
              </p>
            </div>

            {/* Agent ID */}
            <div>
              <label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-2">
                Agent ID
              </label>
              <input
                type="text"
                id="agentId"
                value={formData.agentId}
                onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                placeholder="asst_ABCDEFGXYZ"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.agentId ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.agentId && (
                <p className="mt-1 text-sm text-red-600">{errors.agentId}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                使用するAIエージェントのIDを入力してください（例: asst_ABCDEFGXYZ）
              </p>
            </div>

            {/* Test Connection */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">接続テスト</h3>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  {isTestingConnection ? 'テスト中...' : 'テスト実行'}
                </button>
              </div>
              
              {testResult && (
                <div className={`p-3 rounded-lg ${
                  testResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className={`text-sm ${
                      testResult.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      <pre className="whitespace-pre-wrap font-sans">
                        {testResult.message}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                設定を保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

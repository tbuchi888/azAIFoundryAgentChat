import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertCircle, Check } from 'lucide-react';
import type { AzureConfig } from '../hooks/useAzureConfig';
import { getAzureAgentsList, getAzureAgentInfo } from '../services/azureAgentService';

interface Agent {
  id: string;
  name: string;
  description?: string;
  created_at?: number;
}

interface SettingsPanelProps {
  config: AzureConfig | null;
  onConfigSave: (config: AzureConfig) => void;
  onConfigClear: () => void;
  className?: string;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onConfigSave,
  onConfigClear,
  className = '',
}) => {
  const [endpoint, setEndpoint] = useState(config?.endpoint || '');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [agentId, setAgentId] = useState(config?.agentId || '');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // configが変更された時にstateを更新
  useEffect(() => {
    if (config) {
      setEndpoint(config.endpoint || '');
      setApiKey(config.apiKey || '');
      setAgentId(config.agentId || '');
    }
  }, [config]);

  // エージェント一覧を取得
  const loadAgents = async () => {
    if (!endpoint.trim() || !apiKey.trim()) {
      setAgents([]);
      setAgentsError(null);
      return;
    }

    setIsLoadingAgents(true);
    setAgentsError(null);

    try {
      const agentsList = await getAzureAgentsList(endpoint.trim(), apiKey.trim());
      const formattedAgents: Agent[] = agentsList.map((agent: any) => ({
        id: agent.id,
        name: agent.name || agent.id,
        description: agent.description,
        created_at: agent.created_at,
      }));
      setAgents(formattedAgents);
    } catch (error) {
      console.error('エージェント一覧の取得エラー:', error);
      setAgentsError(error instanceof Error ? error.message : 'エージェント一覧の取得に失敗しました');
      setAgents([]);
    } finally {
      setIsLoadingAgents(false);
    }
  };

  // エンドポイントとAPIキーが変更されたらエージェント一覧を更新
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAgents();
    }, 500); // デバウンス

    return () => clearTimeout(timeoutId);
  }, [endpoint, apiKey]);

  const handleSave = async () => {
    const trimmedEndpoint = endpoint.trim();
    const trimmedApiKey = apiKey.trim();
    const trimmedAgentId = agentId.trim();

    if (!trimmedEndpoint || !trimmedApiKey || !trimmedAgentId) {
      alert('すべての項目を入力してください');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const newConfig: AzureConfig = {
        endpoint: trimmedEndpoint,
        apiKey: trimmedApiKey,
        agentId: trimmedAgentId,
      };

      onConfigSave(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (confirm('設定をクリアしますか？')) {
      setEndpoint('');
      setApiKey('');
      setAgentId('');
      setAgents([]);
      setAgentsError(null);
      onConfigClear();
    }
  };

  const isValidConfig = endpoint.trim() && apiKey.trim() && agentId.trim();

  return (
    <div className={`bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">Azure AI Foundry設定</h2>
      </div>

      <div className="space-y-6">
        {/* エンドポイントURL */}
        <div className="group">
          <label htmlFor="endpoint" className="block text-sm font-semibold text-white/90 mb-2">
            エンドポイントURL <span className="text-pink-400">*</span>
          </label>
          <div className="relative">
            <input
              id="endpoint"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://your-project.services.ai.azure.com/api/projects/your-project"
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200 group-hover:border-white/50"
            />
          </div>
        </div>

        {/* アクセストークン */}
        <div className="group">
          <label htmlFor="apiKey" className="block text-sm font-semibold text-white/90 mb-2">
            アクセストークン <span className="text-pink-400">*</span>
          </label>
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl backdrop-blur-sm">
            <p className="text-sm text-blue-200 font-semibold mb-2">
              アクセストークンの取得方法:
            </p>
            <p className="text-xs text-blue-100 mb-3">
              Azure CLIで以下のコマンドを実行してアクセストークンを取得してください：
            </p>
            <div className="bg-gray-900/80 text-gray-100 p-3 rounded-lg text-xs font-mono border border-gray-700">
              az account get-access-token --scope https://ai.azure.com/.default | jq -r .accessToken
            </div>
            <p className="text-xs text-blue-100 mt-2">
              ※ jqがインストールされていない場合は、出力されたJSONから手動でaccessTokenの値をコピーしてください
            </p>
          </div>
          <div className="relative">
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Azure CLIで取得したアクセストークンを入力"
              className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 group-hover:border-white/50"
            />
          </div>
        </div>

        {/* エージェントID選択 */}
        <div className="group">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="agentId" className="block text-sm font-semibold text-white/90">
              エージェント <span className="text-pink-400">*</span>
            </label>
            <button
              onClick={loadAgents}
              disabled={!endpoint.trim() || !apiKey.trim() || isLoadingAgents}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-blue-200 hover:text-white bg-blue-500/20 hover:bg-blue-500/30 rounded-lg border border-blue-400/30 hover:border-blue-400/60 disabled:text-gray-400 disabled:cursor-not-allowed disabled:bg-gray-500/20 disabled:border-gray-500/30 transition-all duration-200"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingAgents ? 'animate-spin' : ''}`} />
              更新
            </button>
          </div>

          {isLoadingAgents && (
            <div className="flex items-center gap-3 p-4 bg-blue-500/20 rounded-xl mb-3 border border-blue-400/30">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
              <span className="text-sm text-blue-200">エージェント一覧を取得中...</span>
            </div>
          )}

          {agentsError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/20 rounded-xl mb-3 border border-red-400/30">
              <AlertCircle className="w-4 h-4 text-red-300" />
              <span className="text-sm text-red-200">{agentsError}</span>
            </div>
          )}

          {agents.length > 0 ? (
            <div className="relative">
              <select
                id="agentId"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 group-hover:border-white/50 appearance-none cursor-pointer"
              >
                <option value="" className="text-gray-900 bg-white">エージェントを選択してください</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id} className="text-gray-900 bg-white">
                    {agent.name} ({agent.id})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                id="agentId"
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                placeholder="エージェントID (例: asst_xxxxxxxx)"
                className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 group-hover:border-white/50"
              />
            </div>
          )}
          <p className="text-xs text-white/60 mt-2">
            エンドポイントとアクセストークンを入力後、自動的にエージェント一覧を取得します
          </p>
        </div>

        {/* 設定状態表示 */}
        {isValidConfig && (
          <div className="flex items-center gap-3 p-4 bg-green-500/20 rounded-xl border border-green-400/30">
            <Check className="w-5 h-5 text-green-300" />
            <span className="text-sm text-green-200 font-medium">設定が完了しています</span>
          </div>
        )}

        {/* ボタン */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={handleSave}
            disabled={!isValidConfig || isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none font-medium"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? '保存中...' : saveSuccess ? '保存完了' : '設定を保存'}
          </button>

          <button
            onClick={handleClear}
            disabled={isSaving}
            className="px-6 py-3 text-white/80 border border-white/30 rounded-xl hover:bg-white/10 hover:border-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            設定をクリア
          </button>
        </div>
      </div>
    </div>
  );
};

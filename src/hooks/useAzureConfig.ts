import { useState, useEffect } from 'react';

export interface AzureConfig {
  endpoint: string;
  apiKey: string;
  agentId: string;
}

const STORAGE_KEY = 'azure-ai-foundry-config';

export const useAzureConfig = () => {
  const [config, setConfig] = useState<AzureConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // 設定を読み込み
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = () => {
    try {
      // ローカルストレージから設定を取得
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        
        if (isValidConfig(parsedConfig)) {
          setConfig(parsedConfig);
          setIsConfigured(true);
          return;
        }
      }

      // 設定が見つからない場合（これは正常な状態）
      setConfig(null);
      setIsConfigured(false);
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
      setConfig(null);
      setIsConfigured(false);
    }
  };

  const saveConfig = (newConfig: AzureConfig) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      setIsConfigured(true);
    } catch (error) {
      console.error('設定の保存エラー:', error);
      throw new Error('設定の保存に失敗しました');
    }
  };

  const clearConfig = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setConfig(null);
      setIsConfigured(false);
    } catch (error) {
      console.error('設定のクリアエラー:', error);
    }
  };

  const isValidConfig = (config: any): boolean => {
    // AzureConfig形式の場合のみチェック
    if (config &&
        typeof config.endpoint === 'string' &&
        typeof config.apiKey === 'string' &&
        typeof config.agentId === 'string' &&
        config.endpoint.trim() !== '' &&
        config.apiKey.trim() !== '' &&
        config.agentId.trim() !== '') {
      return true;
    }
    
    return false;
  };

  return {
    config,
    isConfigured,
    saveConfig,
    clearConfig,
    loadConfig,
  };
};

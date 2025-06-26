// 実行時環境変数を取得するためのconfig
declare global {
  interface Window {
    __APP_CONFIG__: {
      AZURE_AI_FOUNDARY_ENDPOINT_URL: string;
      AZURE_AI_FOUNDARY_API_KEY: string;
      AZURE_AI_AGENT_ID: string;
    };
  }
}

// デフォルト設定（開発時用）
const defaultConfig = {
  AZURE_AI_FOUNDARY_ENDPOINT_URL: import.meta.env.VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL || '',
  AZURE_AI_FOUNDARY_API_KEY: import.meta.env.VITE_AZURE_AI_FOUNDARY_API_KEY || '',
  AZURE_AI_AGENT_ID: import.meta.env.VITE_AZURE_AI_AGENT_ID || '',
};

// 実行時設定を取得
export const getConfig = () => {
  // 本番環境（Docker）では window.__APP_CONFIG__ を優先
  if (typeof window !== 'undefined' && window.__APP_CONFIG__) {
    return window.__APP_CONFIG__;
  }
  
  // 開発環境では import.meta.env を使用
  return defaultConfig;
};

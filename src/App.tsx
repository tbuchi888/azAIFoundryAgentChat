import { ChatInterface } from './components/ChatInterface';
import { SettingsPanel } from './components/SettingsPanel';
import { useAzureConfig, type AzureConfig } from './hooks/useAzureConfig';

function App() {
  const { config, isConfigured, saveConfig, clearConfig, loadConfig } = useAzureConfig();

  const handleConfigSaved = (newConfig: AzureConfig) => {
    saveConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* 設定パネル - 左サイド */}
      <div className="w-80 bg-white/10 backdrop-blur-xl border-r border-white/20 overflow-y-auto">
        <div className="p-6">
          <SettingsPanel
            config={config}
            onConfigSave={handleConfigSaved}
            onConfigClear={clearConfig}
          />
        </div>
      </div>

      {/* メインコンテンツ - チャットエリア */}
      <div className="flex-1 flex flex-col">
        {isConfigured && config ? (
          <ChatInterface 
            config={config}
            onConfigUpdate={handleConfigSaved}
            onConfigClear={clearConfig}
            onConfigReload={loadConfig}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-lg mx-auto p-12">
              <div className="mb-8">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
                  Azure AI Foundry
                </h2>
                <h3 className="text-2xl font-semibold text-purple-200 mb-6">
                  Chat UI
                </h3>
              </div>
              <p className="text-white/80 text-lg mb-8 leading-relaxed">
                左側の設定パネルでAzure AI Foundryの接続情報を設定してください。
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <p className="text-white/90 font-medium mb-4">必要な情報:</p>
                <ul className="text-white/70 space-y-3 text-left">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                    エンドポイントURL
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-3"></div>
                    アクセストークン
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-pink-400 rounded-full mr-3"></div>
                    エージェントID
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

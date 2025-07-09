import React, { useState } from 'react';
import { Settings, ArrowRight, ExternalLink } from 'lucide-react';
import { ConfigurationPanel } from './ConfigurationPanel';
import type { AzureConfig } from '../hooks/useAzureConfig';

interface SetupWizardProps {
  onConfigSaved: (config: AzureConfig) => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onConfigSaved }) => {
  const [showConfigPanel, setShowConfigPanel] = useState(false);

  const handleConfigSave = (config: AzureConfig) => {
    onConfigSaved(config);
    setShowConfigPanel(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Azure AI Foundry Agent Chat UI
            </h1>
            <p className="text-gray-600">
              AIエージェントとの対話を開始するために、Azure AI Foundryの設定を行います
            </p>
          </div>

          {/* Setup steps */}
          <div className="space-y-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Azure AI Foundryプロジェクトを準備</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Azure AI Foundryでプロジェクトを作成し、エージェントをデプロイしてください。
                  </p>
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p>• Azure AI Studioにアクセスしてプロジェクトを作成</p>
                    <p>• エージェント（Assistant）を作成・デプロイ</p>
                    <p>• プロジェクトのエンドポイントURLを確認</p>
                  </div>
                  <a
                    href="https://learn.microsoft.com/ja-jp/azure/ai-foundry/quickstarts/get-started-code"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Azure AI Foundry クイックスタート
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-gray-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">必要な情報を収集</h3>
                  <div className="text-sm text-gray-600 space-y-2">
                    <div>
                      <p className="font-medium">• エンドポイントURL:</p>
                      <p className="ml-2 text-xs">Azure AI Studio → プロジェクト → [エンドポイント] から確認</p>
                      <p className="ml-2 text-xs text-blue-600">例: https://your-project.services.ai.azure.com/api/projects/your-project</p>
                    </div>
                    <div>
                      <p className="font-medium">• APIキー:</p>
                      <p className="ml-2 text-xs">Azure AI Studio → プロジェクト → [キーとエンドポイント] から取得</p>
                      <p className="ml-2 text-xs text-blue-600">または Azure CLIで: az account get-access-token --scope https://ml.azure.com</p>
                    </div>
                    <div>
                      <p className="font-medium">• Agent ID:</p>
                      <p className="ml-2 text-xs">Azure AI Studio → エージェント → 作成したエージェントのID</p>
                      <p className="ml-2 text-xs text-blue-600">形式: asst_xxxxxxxxxx</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-green-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">設定を入力</h3>
                  <p className="text-sm text-gray-600">
                    下のボタンをクリックして設定画面を開き、Azure AI Foundryの情報を入力してください。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Setup button */}
          <div className="text-center">
            <button
              onClick={() => setShowConfigPanel(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              設定を開始
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Security note */}
          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="text-sm">
              <p className="text-amber-800 font-medium mb-1">セキュリティについて</p>
              <p className="text-amber-700">
                設定情報はブラウザのローカルストレージに保存されます。
                本番環境では、適切なセキュリティ対策を講じてください。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <ConfigurationPanel
        config={null}
        onSave={handleConfigSave}
        onCancel={() => setShowConfigPanel(false)}
        isOpen={showConfigPanel}
      />
    </div>
  );
};

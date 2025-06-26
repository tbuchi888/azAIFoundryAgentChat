<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Azure AI Foundry Agent Chat UI プロジェクト

このプロジェクトは、Azure AI Foundry Agent と連携するReact TypeScriptベースのChat UIです。

## プロジェクト構成
- **React + TypeScript**: モダンなWebフロントエンド
- **Vite**: 高速なビルドツール
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク
- **Lucide React**: アイコンライブラリ
- **React Dropzone**: ファイルアップロード機能
- **Axios**: HTTP クライアント（Azure API連携用）

## Azure連携
- Azure AI Foundry Agent APIとの通信
- 認証にManagedIdentityを推奨
- ファイル添付機能（最大10MB）
- エラーハンドリングとリトライ機能

## 開発ガイドライン
1. Azure関連のコードはセキュリティベストプラクティスに従う
2. 型安全性を重視し、TypeScriptの恩恵を最大限活用
3. レスポンシブデザインでモバイル対応
4. アクセシビリティを考慮したUI設計
5. 環境変数による設定管理

## 環境変数
- `VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL`: Azure AI Foundry Agentのエンドポイント
- `VITE_AZURE_AI_FOUNDARY_API_KEY`: APIキー

コード生成時は、このプロジェクトの構成とAzureベストプラクティスに従ってください。

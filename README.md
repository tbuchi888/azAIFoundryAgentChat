# Azure AI Foundry Agent Chat UI
> [!IMPORTANT]
> このリポジトリは、Github Copilot Agent モードにより、Vive Coding したものです。

> [!Warning]
> テストなども、十分に出来ていませんので、ご利用の際はご注意ください。

Azure AI Foundry Agent と連携するモダンなChat UIアプリケーションです。テキストメッセージとファイル添付によってAIエージェントと対話できます。

## 🚀 機能

- ✨ **モダンなUI**: React + TypeScript + Tailwind CSSによる美しいインターフェース
- 🤖 **Azure AI Foundry Agent連携**: Azure AIサービスとの安全な通信
- 📎 **ファイル添付**: PDF、Word、Excel、画像、テキストファイルのアップロード
- 💬 **リアルタイムチャット**: 直感的なチャットインターフェース
- 🔄 **自動リトライ**: 一時的な障害に対する自動復旧機能
- 🛡️ **セキュリティ**: Azure認証とベストプラクティスに準拠

## 📋 前提条件

- Node.js 18以上
- Azure AI Foundry Agent
  - エンドポイント
  - APIキー
  - Agent ID

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成し、Azure AI Foundry Agentの設定を入力してください。

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL=https://[YOUR_AIFOUNDRY].services.ai.azure.com/api/projects/[YOURPROJECT]
VITE_AZURE_AI_FOUNDARY_API_KEY=[YOUR_APIKEY or AZ_AUTH_TOKEN]
VITE_AZURE_AI_AGENT_ID=[YOUR_AGENTID i.e. asst_ABCDEFGXYZ]
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:5173 を開いてアプリケーションにアクセスできます。

## 🏗️ ビルド

プロダクション用ビルドを作成：

```bash
npm run build
```

ビルドされたファイルは`dist`フォルダに出力されます。

## 🐳 Docker でのデプロイ

### Docker イメージのビルドと実行

1. **Docker イメージのビルド:**

```bash
docker build -t azure-ai-foundry-chat-ui .
```

2. **Docker コンテナの実行:**

```bash
docker run -d \
  --name azure-ai-chat \
  -p 8080:8080 \
  -e VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL="https://[YOUR_AIFOUNDRY].services.ai.azure.com/api/projects/[YOURPROJECT]" \
  -e VITE_AZURE_AI_FOUNDARY_API_KEY="[YOUR_APIKEY or AZ_AUTH_TOKEN]" \
  -e VITE_AZURE_AI_AGENT_ID="[YOUR_AGENTID i.e. asst_ABCDEFGXYZ]" \
  azure-ai-foundry-chat-ui
```

### Docker Compose を使用（推奨）

1. **環境変数ファイルの設定:**

```bash
cp .env.example .env
# .envファイルを編集して実際のAzure設定を入力
```

2. **Docker Compose で起動:**

```bash
docker-compose up -d
```

3. **アクセス:**
   - アプリケーション: <http://localhost:8080>
   - ヘルスチェック: <http://localhost:8080/health>

4. **停止:**

```bash
docker-compose down
```

### コンテナの特徴

- **Multi-stage build**: 効率的なイメージサイズ
- **Non-root user**: セキュリティ強化
- **Nginx**: 高性能なWebサーバー
- **Health check**: コンテナの健全性監視
- **Gzip圧縮**: 転送速度の最適化
- **セキュリティヘッダー**: XSS、CSRF保護

## 📚 使用方法

1. **メッセージ送信**: テキストボックスにメッセージを入力し、Enterキーまたは送信ボタンでAIエージェントに送信
2. **ファイル添付**: ドラッグ&ドロップまたはクリックしてファイルを選択し、メッセージと一緒に送信
3. **対話履歴**: 送信したメッセージとAIからの応答が時系列で表示

## 🔧 技術仕様

### サポートファイル形式
- **テキスト**: .txt, .md
- **文書**: .pdf, .docx, .xlsx
- **画像**: .jpg, .jpeg, .png, .gif, .webp
- **データ**: .json, .csv

### ファイルサイズ制限
- 最大10MBまで

## 🏗️ アーキテクチャ

### フロントエンド
- **React 18**: UIライブラリ
- **TypeScript**: 型安全な開発
- **Vite**: 高速ビルドツール
- **Tailwind CSS**: ユーティリティファーストCSS

### Azure連携
- **Azure AI Foundry Agent API**: チャット機能の中核
- **Axios**: HTTP通信ライブラリ
- **自動リトライ**: 指数バックオフによる障害復旧

### セキュリティ
- 環境変数による設定管理
- CSRFプロテクション
- ファイル形式とサイズの検証

## 📁 プロジェクト構造

```
src/
├── components/           # Reactコンポーネント
│   ├── ChatInterface.tsx  # メインチャット画面
│   ├── ChatMessage.tsx    # メッセージ表示
│   └── FileUpload.tsx     # ファイルアップロード
├── services/            # APIサービス
│   └── azureAgentService.ts # Azure Agent API連携
├── types/               # TypeScript型定義
│   └── agent.ts         # Chat/Agent関連の型
├── utils/               # ユーティリティ関数
│   └── fileUtils.ts     # ファイル処理関数
└── App.tsx              # メインアプリケーション
```

## 🔗 関連リンク
- [クイック スタート: Azure AI Foundry の概要 Foundry ベース](https://learn.microsoft.com/ja-jp/azure/ai-foundry/quickstarts/get-started-code?tabs=azure-ai-foundry&pivots=fdp-project)
- [Azure AI Foundry Agent REST API Data Plane](https://learn.microsoft.com/en-us/rest/api/aifoundry/aiagents/operation-groups?view=rest-aifoundry-aiagents-v1)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

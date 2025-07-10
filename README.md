# Azure AI Foundry Agent Chat UI
> [!IMPORTANT]
> このリポジトリは、Github Copilot Agent モードにより、Vive Coding したものです。

> [!Warning]
> テストなども、十分に出来ていませんので、ご利用の際はご注意ください。

Azure AI Foundry Agent と連携するモダンなChat UIアプリケーションです。テキストメッセージによってAIエージェントと対話できます。

![image](https://github.com/user-attachments/assets/b5f6e7de-a05c-47f6-8d12-3a4745eebea2)

## 🚀 機能

- ✨ **モダンなUI**: React + TypeScript + Tailwind CSSによる美しいインターフェース
- 🤖 **Azure AI Foundry Agent連携**: Azure AIサービスとの安全な通信
- ⚙️ **UI設定機能**: ブラウザ上で簡単にAzure設定を管理
- 💬 **リアルタイムチャット**: 直感的なチャットインターフェース
- 🔄 **自動リトライ**: 一時的な障害に対する自動復旧機能
- 🛡️ **セキュリティ**: Azure認証とベストプラクティスに準拠

## 📋 前提条件

- Node.js 18以上
- Azure AI Foundry Agent
  - エンドポイント
  - APIキー
  - Agent の作成

## 🛠️ セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 設定方法

Azure AI Foundry Agentの設定は、UI上で直接行います：

#### アクセストークンの取得

Azure AI Foundryには正しいアクセストークンが必要です。Azure CLIを使用して取得してください：

```bash
# Azure CLIでログイン（まだの場合）
az login

# Azure AI Foundry用のアクセストークンを取得
az account get-access-token --scope https://ai.azure.com/.default | jq -r .accessToken
```

**jqがインストールされていない場合:**

```bash
az account get-access-token --scope https://ai.azure.com/.default
```

出力されたJSONから手動で`accessToken`の値をコピーしてください。

#### UI上での設定

アプリケーションを起動すると、設定画面が表示されます。以下の情報を入力してください：

- **エンドポイントURL**: `https://[YOUR_AIFOUNDRY].services.ai.azure.com/api/projects/[YOURPROJECT]`
- **アクセストークン**: 上記のコマンドで取得したアクセストークン
- **Agent ID**: 使用するエージェントのIDを一覧から選択

設定はブラウザのローカルストレージに保存され、チャット画面の設定ボタンからいつでも変更できます。

> [!TIP]
> セキュリティとユーザビリティの観点から、環境変数ではなくUI上での設定を推奨しています。

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで <http://localhost:5173> を開いてアプリケーションにアクセスできます。

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
docker run -d --rm \
  --name azure-ai-chat \
  -p 8080:8080 \
  azure-ai-foundry-chat-ui
```

3. **アクセス:**
   - アプリケーション: <http://localhost:8080>
   - ヘルスチェック: <http://localhost:8080/health>

4. **停止:**

```bash
docker stop azure-ai-chat
```

### Build 済み Docker イメージの実行
1. **Docker コンテナの実行:**

```bash
docker run -d --rm \     
  --name azure-ai-chat \
  -p 8080:8080 \
  takuyak/azure-ai-foundry-chat-ui:latest
```

2. **アクセス:**
   - アプリケーション: <http://localhost:8080>
   - ヘルスチェック: <http://localhost:8080/health>

3. **停止:**

```bash
docker stop azure-ai-chat
```

## 📚 使用方法

1. **初期設定**: アプリケーションを起動すると設定画面が表示されます。Azure AI Foundryの情報を入力してください
2. **メッセージ送信**: テキストボックスにメッセージを入力し、Enterキーまたは送信ボタンでAIエージェントに送信
3. **設定変更**: チャット画面右側で、いつでも設定を変更可能
4. **対話履歴**: 送信したメッセージとAIからの応答が時系列で表示

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

- ローカルストレージによる設定管理
- CSRFプロテクション
- ファイル形式とサイズの検証

## 📁 プロジェクト構造

```
src/
├── components/              # Reactコンポーネント
│   ├── ChatInterface.tsx    # メインチャット画面
│   ├── ChatMessage.tsx      # メッセージ表示コンポーネント
│   ├── ConfigurationPanel.tsx # 設定パネル（初期設定用）
│   ├── SettingsPanel.tsx    # 設定管理パネル
│   └── SetupWizard.tsx      # 初期セットアップウィザード
├── hooks/                   # Reactカスタムフック
│   └── useAzureConfig.ts    # Azure設定管理フック
├── services/                # APIサービス
│   └── azureAgentService.ts # Azure AI Foundry Agent API連携
├── types/                   # TypeScript型定義
│   └── agent.ts             # Chat/Agent関連の型定義
├── assets/                  # 静的アセット
│   └── react.svg            # Reactロゴ
├── App.tsx                  # メインアプリケーションコンポーネント
├── App.css                  # アプリケーション固有のスタイル
├── index.css                # グローバルスタイル（Tailwind CSS含む）
├── main.tsx                 # アプリケーションエントリーポイント
└── vite-env.d.ts           # Vite環境変数の型定義
```

## 🔗 関連リンク

- [クイック スタート: Azure AI Foundry の概要 Foundry ベース](https://learn.microsoft.com/ja-jp/azure/ai-foundry/quickstarts/get-started-code?tabs=azure-ai-foundry&pivots=fdp-project)
- [Azure AI Foundry Agent REST API Data Plane](https://learn.microsoft.com/en-us/rest/api/aifoundry/aiagents/operation-groups?view=rest-aifoundry-aiagents-v1)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)

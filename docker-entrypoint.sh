#!/bin/sh

# Dockerコンテナ用のentrypoint script
# 環境変数からconfig.jsを動的生成し、Nginxを起動

# 設定ファイルの生成
echo "Generating runtime configuration..."

cat > /usr/share/nginx/html/config.js << EOF
// Runtime configuration for Azure AI Foundry Agent Chat UI
window.__APP_CONFIG__ = {
  AZURE_AI_FOUNDARY_ENDPOINT_URL: '${VITE_AZURE_AI_FOUNDARY_ENDPOINT_URL}',
  AZURE_AI_FOUNDARY_API_KEY: '${VITE_AZURE_AI_FOUNDARY_API_KEY}',
  AZURE_AI_AGENT_ID: '${VITE_AZURE_AI_AGENT_ID}'
};
EOF

echo "Runtime configuration generated:"
cat /usr/share/nginx/html/config.js

# Nginx設定のテスト
echo "Testing Nginx configuration..."
nginx -t

# Nginxの起動
echo "Starting Nginx..."
exec nginx -g "daemon off;"

#!/bin/sh

# Dockerコンテナ用のentrypoint script
# Azure AI Foundry Agent Chat UI用の軽量な起動スクリプト

echo "Starting Azure AI Foundry Agent Chat UI..."

# Nginx設定のテスト
echo "Testing Nginx configuration..."
nginx -t

# Nginxの起動
echo "Starting Nginx..."
exec nginx -g "daemon off;"

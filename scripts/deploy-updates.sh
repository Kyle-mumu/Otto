#!/usr/bin/env bash
# deploy-updates.sh — 上传更新包到 ECS（Kyle 手跑）
# 用法：bash scripts/deploy-updates.sh
# 前提：SSH 免密已配置（/Users/Kyle/.ssh/id_ed25519）
set -euo pipefail

ECS_IP="121.43.110.135"
ECS_USER="root"
CONTAINER="new6"
BUNDLE_DIR="src-tauri/target/release/bundle/macos"
REMOTE_DIR="/tmp/otto-updates"

echo "=== 1. 创建 ECS 临时目录 ==="
ssh "${ECS_USER}@${ECS_IP}" "mkdir -p ${REMOTE_DIR}"

echo "=== 2. 上传更新文件到 ECS ==="
scp "${BUNDLE_DIR}/Otto.app.tar.gz"     "${ECS_USER}@${ECS_IP}:${REMOTE_DIR}/"
scp "${BUNDLE_DIR}/Otto.app.tar.gz.sig"  "${ECS_USER}@${ECS_IP}:${REMOTE_DIR}/"

echo "=== 3. 复制到容器内 /data/updates/ ==="
ssh "${ECS_USER}@${ECS_IP}" "docker exec ${CONTAINER} mkdir -p /data/updates"
ssh "${ECS_USER}@${ECS_IP}" "docker cp ${REMOTE_DIR}/Otto.app.tar.gz ${CONTAINER}:/data/updates/"
ssh "${ECS_USER}@${ECS_IP}" "docker cp ${REMOTE_DIR}/Otto.app.tar.gz.sig ${CONTAINER}:/data/updates/"

echo "=== 4. 验证 ==="
ssh "${ECS_USER}@${ECS_IP}" "docker exec ${CONTAINER} ls -la /data/updates/"

echo "=== 5. 清理 ECS 临时目录 ==="
ssh "${ECS_USER}@${ECS_IP}" "rm -rf ${REMOTE_DIR}"

echo "✅ 部署完成"
echo "manifest URL: http://${ECS_IP}:8000/updates/latest.json"
echo "更新包 URL:   http://${ECS_IP}:8000/updates/Otto.app.tar.gz"

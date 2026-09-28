#!/usr/bin/env bash
# ============================================================
# deploy-updates.sh — 上传 Otto 更新包到部署服务器（客户可配置版）
# ------------------------------------------------------------
# 用法：
#   1) 复制 .env.example 为 .env.deploy 并填入客户自己的值（或直接改下方默认值）
#   2) bash scripts/deploy-updates.sh
#
# 前置：
#   - 已配置 SSH 免密登录到 DEPLOY_HOST（推荐钥匙登录）
#   - 更新包已构建完毕，位于 BUNDLE_DIR
#
# 兼容性：所有变量均可用「环境变量」覆盖；未设置时回落到默认值。
#         默认值 = Kyle 本机现值，用于本地回归（不改变既有行为）。
# ============================================================
set -euo pipefail

# ---------- 可配置项（5 变量 + 1 URL）----------
# 每一项：优先读环境变量，未设置则用默认值。
DEPLOY_HOST="${DEPLOY_HOST:-121.43.110.135}"          # 部署服务器地址（IP 或域名）
DEPLOY_USER="${DEPLOY_USER:-root}"                    # SSH 登录用户
DEPLOY_CONTAINER="${DEPLOY_CONTAINER:-new6}"          # 目标容器名
DEPLOY_UPDATES_DIR="${DEPLOY_UPDATES_DIR:-/data/updates}"  # 容器内更新包落点
DEPLOY_PUBLIC_URL="${DEPLOY_PUBLIC_URL:-http://121.43.110.135:8000}"  # 客户端可访问的对外基址

# ---------- 以下为固定路径，一般无需修改 ----------
BUNDLE_DIR="${BUNDLE_DIR:-src-tauri/target/release/bundle/macos}"  # 本机更新包目录
REMOTE_DIR="${REMOTE_DIR:-/tmp/otto-updates}"                      # 服务器中转目录

APP_NAME="Otto.app.tar.gz"
SIG_NAME="Otto.app.tar.gz.sig"

# ---------- 1. 创建服务器临时目录 ----------
echo "=== 1. 创建服务器临时目录 ==="
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "mkdir -p ${REMOTE_DIR}"

# ---------- 2. 上传更新文件 ----------
echo "=== 2. 上传更新文件 ==="
scp "${BUNDLE_DIR}/${APP_NAME}"    "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/"
scp "${BUNDLE_DIR}/${SIG_NAME}"    "${DEPLOY_USER}@${DEPLOY_HOST}:${REMOTE_DIR}/"

# ---------- 3. 复制到容器内更新目录 ----------
echo "=== 3. 复制到容器内 ${DEPLOY_UPDATES_DIR} ==="
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker exec ${DEPLOY_CONTAINER} mkdir -p ${DEPLOY_UPDATES_DIR}"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker cp ${REMOTE_DIR}/${APP_NAME} ${DEPLOY_CONTAINER}:${DEPLOY_UPDATES_DIR}/"
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker cp ${REMOTE_DIR}/${SIG_NAME} ${DEPLOY_CONTAINER}:${DEPLOY_UPDATES_DIR}/"

# ---------- 4. 验证 ----------
echo "=== 4. 验证 ==="
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "docker exec ${DEPLOY_CONTAINER} ls -la ${DEPLOY_UPDATES_DIR}/"

# ---------- 5. 清理服务器临时目录 ----------
echo "=== 5. 清理服务器临时目录 ==="
ssh "${DEPLOY_USER}@${DEPLOY_HOST}" "rm -rf ${REMOTE_DIR}"

echo "✅ 部署完成"
echo "manifest URL: ${DEPLOY_PUBLIC_URL}/updates/latest.json"
echo "更新包 URL:   ${DEPLOY_PUBLIC_URL}/updates/${APP_NAME}"

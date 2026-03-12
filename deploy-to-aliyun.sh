#!/bin/bash

# ============================================
# Golf AI Tracker - 阿里云一键部署脚本
# ============================================
# 服务器：121.43.61.10
# 系统：Alibaba Cloud Linux 3.2104 LTS
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
SERVER_IP="121.43.61.10"
SERVER_USER="root"
PROJECT_NAME="ai-golf.top"
DEPLOY_DIR="/var/www/${PROJECT_NAME}"

echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Golf AI Tracker 阿里云部署脚本${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""

# 步骤 1：检查 SSH 连接
echo -e "${YELLOW}[1/8] 检查 SSH 连接...${NC}"
if ! ssh -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_IP} "echo '连接成功'" > /dev/null 2>&1; then
    echo -e "${RED}❌ 无法连接到服务器 ${SERVER_IP}${NC}"
    echo "请检查："
    echo "  1. 服务器是否运行中"
    echo "  2. 安全组是否开放 22 端口"
    echo "  3. SSH 密钥是否正确"
    exit 1
fi
echo -e "${GREEN}✅ SSH 连接成功${NC}"
echo ""

# 步骤 2：上传代码
echo -e "${YELLOW}[2/8] 上传代码到服务器...${NC}"
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
    --exclude '.env' --exclude '*.log' \
    ./ ${SERVER_USER}@${SERVER_IP}:${DEPLOY_DIR}/
echo -e "${GREEN}✅ 代码上传完成${NC}"
echo ""

# 步骤 3：在服务器上执行部署
echo -e "${YELLOW}[3/8] 在服务器上执行部署命令...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
set -e

DEPLOY_DIR="/var/www/ai-golf.top"
cd ${DEPLOY_DIR}

# 创建目录
echo "创建部署目录..."
mkdir -p ${DEPLOY_DIR}

# 安装 Docker（如果未安装）
if ! command -v docker &> /dev/null; then
    echo "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# 安装 Docker Compose（如果未安装）
if ! command -v docker-compose &> /dev/null; then
    echo "安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
        -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo "✅ Docker 和 Docker Compose 已就绪"

# 创建环境变量文件
echo "创建环境变量配置..."
cat > server/.env << 'ENVEOF'
# 服务端口
PORT=3000

# MongoDB 连接
MONGO_URI=mongodb+srv://golfcoach:ibm00ibm@cluster0.omomlp0.mongodb.net/golf-tracker?retryWrites=true&w=majority&appName=Cluster0

# DeepSeek API
DEEPSEEK_API_KEY=sk-35eb6fa57dff414d9597cdd91c77f250

# 天气 API
WEATHER_API_KEY=933a528d7e1147ed97744718251712

# JWT 密钥
JWT_SECRET=jwt_secret_2026_golf_tracker_ai_golf_top_secure_key_32chars

# 邮件服务
EMAIL_HOST=smtp.139.com
EMAIL_PORT=25
EMAIL_USER=13928737359@139.com
EMAIL_PASS=5c5252c9e8858fe22500
EMAIL_SECURE=false
ENVEOF

# 创建前端环境变量
cat > client/.env.production << 'ENVEOF'
VITE_WEATHER_API_KEY=933a528d7e1147ed97744718251712
VITE_API_URL=https://api.ai-golf.top
ENVEOF

echo "✅ 环境变量配置完成"

# 安装依赖
echo "安装后端依赖..."
cd server
npm install --production
cd ..

echo "安装前端依赖..."
cd client
npm install
cd ..

# 构建前端
echo "构建前端..."
cd client
npm run build
cd ..

# 构建 Docker 镜像
echo "构建 Docker 镜像..."
docker-compose build

# 启动服务
echo "启动 Docker 容器..."
docker-compose up -d

# 查看状态
echo ""
echo "================================="
echo "  部署完成！"
echo "================================="
echo ""
docker-compose ps

echo ""
echo "服务访问地址："
echo "  前端：http://${SERVER_IP}:8001"
echo "  后端：http://${SERVER_IP}:3000"
echo ""
echo "查看日志：docker-compose logs -f"
echo "重启服务：docker-compose restart"
echo ""

ENDSSH

echo -e "${GREEN}✅ 部署完成！${NC}"
echo ""
echo -e "${YELLOW}======================================${NC}"
echo -e "${YELLOW}  访问地址：${NC}"
echo -e "${GREEN}  前端：http://${SERVER_IP}:8001${NC}"
echo -e "${GREEN}  后端：http://${SERVER_IP}:3000${NC}"
echo -e "${YELLOW}======================================${NC}"
echo ""

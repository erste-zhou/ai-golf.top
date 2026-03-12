# Golf AI Tracker - 部署文档

**版本：** v1.0.0-stable  
**日期：** 2026-03-12  
**GitHub：** https://github.com/erste-zhou/ai-golf.top  
**域名：** ai-golf.top  
**旧部署地址：** https://ai-golf-tracker.onrender.com（Render.com 免费部署）  
**旧部署：** https://ai-golf-tracker.onrender.com

---

## 📋 目录

1. [项目架构](#项目架构)
2. [本地开发环境](#本地开发环境)
3. [远端部署方案](#远端部署方案)
4. [环境变量配置](#环境变量配置)
5. [部署步骤](#部署步骤)
6. [域名配置](#域名配置)

---

## 项目架构

### 技术栈

| 部分 | 技术 | 说明 |
|------|------|------|
| **Frontend** | Vite + React + Tailwind CSS | 前端构建工具 + UI 框架 |
| **Backend** | Node.js + Express | RESTful API 服务 |
| **Database** | MongoDB Atlas | 云数据库 |
| **AI** | DeepSeek V3 | AI 高尔夫教练 |
| **Weather** | WeatherAPI | 天气数据 |

### 项目结构

```
ai-golf.top/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── App.jsx        # 路由配置
│   │   └── main.jsx       # 入口文件
│   ├── nginx.conf         # Nginx 配置
│   └── package.json
│
├── server/                # 后端代码
│   ├── models/           # 数据模型
│   ├── routes/           # API 路由
│   ├── middleware/       # 中间件
│   ├── index.js          # 入口文件
│   └── package.json
│
└── docker-compose.yml    # Docker 编排
```

---

## 本地开发环境

### 前置要求

- Node.js 20+
- Docker & Docker Compose
- Git

### 本地运行

```bash
# 1. 克隆项目
git clone git@github.com:erste-zhou/ai-golf.top.git
cd ai-golf.top

# 2. 安装依赖
cd server && npm install
cd ../client && npm install

# 3. 配置环境变量
# 编辑 server/.env 和 client/.env

# 4. 启动服务
cd ..
docker-compose up -d
```

### 本地访问

- **前端：** http://localhost:8001
- **后端 API：** http://localhost:3000

---

## 远端部署方案

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Render.com** | 免费额度、自动部署、支持 Docker | 免费实例会休眠 | ⭐⭐⭐⭐ |
| **Vercel + Railway** | Vercel 前端免费、Railway 后端稳定 | 需要分开部署 | ⭐⭐⭐⭐ |
| **自建 VPS** | 完全控制、无限制 | 需要运维、有成本 | ⭐⭐⭐ |
| **Netlify + Render** | Netlify 前端 CDN 快 | 配置稍复杂 | ⭐⭐⭐ |

### 推荐方案：Render.com

**原因：**
- 支持 Docker Compose 一键部署
- 免费额度够用（每月 750 小时）
- 自动 HTTPS
- 支持自定义域名

---

## 环境变量配置

### 必需的环境变量

#### 后端 (server/.env)

```env
# ⚠️ 重要：.env 文件不应该提交到 Git！
# 确保 .env 在 .gitignore 中

# 服务端口
PORT=3000

# 数据库连接（示例 - 请使用自己的连接串）
MONGO_URI=mongodb+srv://golfcoach:ibm00ibm@cluster0.omomlp0.mongodb.net/golf-tracker?retryWrites=true&w=majority&appName=Cluster0

# JWT 密钥（生成随机字符串）
JWT_SECRET=your-random-secret-key-min-32-chars

# AI 服务
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx

# 天气服务
WEATHER_API_KEY=933a528d7e1147ed97744718251712

# 邮件服务（可选，用于密码重置）
EMAIL_HOST=smtp.139.com
EMAIL_PORT=465
EMAIL_USER=your-email@139.com
EMAIL_PASS=your-auth-code
```

#### .gitignore 配置

确保 `.env` 文件不被提交：

```bash
# .gitignore
.env
.env.local
.env.production
```

#### 前端 (client/.env)

**本地开发：** `client/.env`
```env
VITE_WEATHER_API_KEY=933a528d7e1147ed97744718251712
VITE_API_URL=http://localhost:3000
```

**生产环境：** `client/.env.production`
```env
VITE_WEATHER_API_KEY=933a528d7e1147ed97744718251712
VITE_API_URL=https://api.ai-golf.top
```

**部署平台环境变量（Vercel/Railway/Render）：**
- `VITE_WEATHER_API_KEY`: `933a528d7e1147ed97744718251712`
- `VITE_API_URL`: `https://你的域名.com` 或 `https://xxx.onrender.com`

---

## 部署步骤

### 方案 A：Render.com 部署

#### 1. 准备 GitHub 仓库

```bash
# 确保代码已推送到 GitHub
cd ~/Desktop/ai-golf
git add .
git commit -m "v1.0.0-stable: 鸟洞/鸡洞数据保存修复"
git push origin main
```

#### 2. 创建 Render 服务

1. 访问 https://render.com
2. 登录 GitHub 账号
3. 点击 **New +** → **Blueprint**
4. 选择 `ai-golf.top` 仓库
5. 连接仓库

#### 3. 配置环境变量

在 Render 控制台添加以下环境变量：

```
MONGO_URI=mongodb+srv://golfcoach:ibm00ibm@cluster0.omomlp0.mongodb.net/golf-tracker?retryWrites=true&w=majority&appName=Cluster0
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx  # 请填写你的 DeepSeek API Key
WEATHER_API_KEY=933a528d7e1147ed97744718251712
JWT_SECRET=随机生成的密钥（至少 32 字符）
```

#### 4. 部署

- Render 会自动构建并部署
- 等待构建完成（约 5-10 分钟）
- 获取分配的域名：`xxx.onrender.com`

#### 5. 配置自定义域名

1. 在 Render 控制台 → **Settings** → **Custom Domain**
2. 添加域名：`api.ai-golf.top`
3. 按提示配置 DNS CNAME 记录

---

### 方案 B：Vercel + Railway 部署

#### 前端 (Vercel)

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 进入前端目录
cd client

# 3. 部署
vercel --prod
```

**Vercel 配置：**
- 构建命令：`npm run build`
- 输出目录：`dist`
- 环境变量：`VITE_WEATHER_API_KEY`, `VITE_API_URL`

#### 后端 (Railway)

1. 访问 https://railway.app
2. 新建项目 → **Deploy from GitHub repo**
3. 选择 `ai-golf.top` 仓库
4. 设置 `Root Directory` 为 `server`
5. 添加环境变量

---

### 方案 C：自建 VPS 部署

#### 1. 服务器要求

- Ubuntu 20.04+
- 2GB RAM
- Docker & Docker Compose

#### 2. 安装 Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

#### 3. 部署

```bash
# 1. 克隆项目
git clone git@github.com:erste-zhou/ai-golf.top.git
cd ai-golf.top

# 2. 创建 .env 文件
cp server/.env.example server/.env
# 编辑 .env 填入实际配置

# 3. 启动
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

#### 4. 配置 Nginx 反向代理

```nginx
server {
    listen 80;
    server_name ai-golf.top;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 域名配置

### DNS 记录

| 类型 | 主机记录 | 记录值 | 说明 |
|------|----------|--------|------|
| A | @ | VPS IP | 主域名 |
| A | www | VPS IP | www 子域名 |
| CNAME | api | render 域名 | API 服务 |
| CNAME | app | vercel 域名 | 前端服务 |

### SSL 证书

使用 Let's Encrypt 免费证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ai-golf.top -d www.ai-golf.top
```

---

## 部署检查清单

### 部署前

- [ ] 代码已推送到 GitHub
- [ ] 所有 API 地址已更新为生产环境
- [ ] 环境变量已配置
- [ ] MongoDB 连接串已更新
- [ ] 测试账号已创建

### 部署后

- [ ] 访问前端页面正常
- [ ] 登录/注册功能正常
- [ ] 添加成绩功能正常
- [ ] 数据保存正常
- [ ] AI 教练功能正常
- [ ] HTTPS 已启用

---

## 故障排查

### 常见问题

#### 1. 前端无法连接后端

**检查：**
- 环境变量 `VITE_API_URL` 是否正确
- 后端服务是否运行
- CORS 配置是否正确

#### 2. 数据库连接失败

**检查：**
- MongoDB Atlas IP 白名单是否包含服务器 IP
- 连接串用户名密码是否正确
- 网络是否通畅

#### 3. Docker 构建失败

**检查：**
- Dockerfile 路径是否正确
- package.json 是否存在
- 依赖是否能正常下载

---

## 维护指南

### 日常维护

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 更新代码
git pull origin main
docker-compose up -d --build

# 清理空间
docker system prune -a
```

### 备份数据库

```bash
# 导出 MongoDB 数据
mongodump --uri="你的连接串" --out=./backup

# 导入数据
mongorestore --uri="你的连接串" ./backup
```

---

## 联系方式

- **GitHub:** https://github.com/erste-zhou/ai-golf.top
- **域名:** ai-golf.top
- **部署平台:** Render.com / Vercel / Railway

---

**最后更新：** 2026-03-12  
**版本：** v1.0.0-stable

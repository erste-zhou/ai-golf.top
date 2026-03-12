# 🚀 快速部署指南

**最后更新：** 2026-03-12  
**当前版本：** v1.0.0-stable

---

## 📋 部署前准备

### 1. 账号准备

| 平台 | 账号 | 状态 |
|------|------|------|
| **GitHub** | erste-zhou | ✅ 已有 |
| **MongoDB Atlas** | golfcoach | ✅ 已有 |
| **Render/Railway** | 用 GitHub 登录 | ⏳ 待注册 |
| **Vercel** | 用 GitHub 登录 | ⏳ 待注册 |

### 2. 环境变量准备

**后端需要：**
```env
MONGO_URI=mongodb+srv://golfcoach:ibm00ibm@cluster0.omomlp0.mongodb.net/golf-tracker?retryWrites=true&w=majority&appName=Cluster0
DEEPSEEK_API_KEY=sk-35eb6fa57dff414d9597cdd91c77f250  # ✅ 已配置
WEATHER_API_KEY=933a528d7e1147ed97744718251712
JWT_SECRET=随机 32 字符以上字符串
```

**前端需要：**
```env
VITE_WEATHER_API_KEY=933a528d7e1147ed97744718251712
VITE_API_URL=https://你的后端域名.com
```

---

## 🎯 推荐部署方案

### 方案 A：Vercel + Railway（推荐）

**优点：**
- Vercel 前端免费 + 全球 CDN
- Railway 后端稳定，不休眠
- 都用 GitHub 一键登录

**步骤：**

#### 1. 部署后端到 Railway

1. 访问 https://railway.app
2. 点击 **Login** → 用 GitHub 登录
3. **New Project** → **Deploy from GitHub repo**
4. 选择 `ai-golf.top` 仓库
5. **Variables** 添加环境变量：
   ```
   MONGO_URI=你的 MongoDB 连接串
   DEEPSEEK_API_KEY=你的 DeepSeek Key
   WEATHER_API_KEY=933a528d7e1147ed97744718251712
   JWT_SECRET=随机密钥
   ```
6. **Settings** → **Root Directory** 设置为 `server`
7. Railway 会自动部署
8. 获取域名：`xxx.railway.app`

#### 2. 部署前端到 Vercel

1. 访问 https://vercel.com
2. 点击 **Login** → 用 GitHub 登录
3. **Add New** → **Project**
4. 选择 `ai-golf.top` 仓库
5. **Configure Project** 添加环境变量：
   ```
   VITE_WEATHER_API_KEY=933a528d7e1147ed97744718251712
   VITE_API_URL=https://xxx.railway.app  # Railway 分配的域名
   ```
6. **Framework Preset** 选择 `Vite`
7. 点击 **Deploy**
8. 获取域名：`xxx.vercel.app`

#### 3. 测试

访问 Vercel 分配的域名，测试：
- [ ] 注册/登录
- [ ] 添加成绩
- [ ] 查看历史记录
- [ ] AI 教练

---

### 方案 B：Render 一体化部署

**优点：**
- 前后端都在一个平台
- 支持 Docker Compose
- 配置简单

**步骤：**

1. 访问 https://render.com
2. 用 GitHub 登录
3. **New +** → **Blueprint**
4. 连接 `ai-golf.top` 仓库
5. 配置环境变量（前后端都需要）
6. 等待自动部署
7. 获取域名：`xxx.onrender.com`

---

## 🌐 自定义域名配置

### 1. DNS 配置

在域名服务商添加 DNS 记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| CNAME | api | `xxx.railway.app` (后端) |
| CNAME | app | `xxx.vercel.app` (前端) |
| CNAME | www | `xxx.vercel.app` |

### 2. 平台配置

**Vercel:**
1. Settings → Domains
2. 添加 `ai-golf.top` 和 `www.ai-golf.top`
3. 按提示配置 DNS

**Railway:**
1. Settings → Domains
2. 添加 `api.ai-golf.top`
3. 配置 DNS CNAME

---

## ✅ 部署检查清单

### 部署前
- [ ] 代码已推送到 GitHub
- [ ] DeepSeek API Key 已配置
- [ ] MongoDB 连接正常
- [ .env 文件已添加到 .gitignore

### 部署后
- [ ] 访问前端页面正常
- [ ] 注册/登录功能正常
- [ ] 添加成绩功能正常
- [ ] 数据保存正常（鸟洞/鸡洞等）
- [ ] AI 教练功能正常
- [ ] HTTPS 已启用

---

## 🔧 常用命令

### 查看日志
```bash
# Railway
railway logs

# Vercel
vercel logs

# Render
# 在控制台查看
```

### 更新部署
```bash
# 推送代码后自动部署
git push origin main

# 或手动触发
vercel --prod
```

---

## 📞 支持

- **GitHub:** https://github.com/erste-zhou/ai-golf.top
- **部署文档:** DEPLOYMENT.md
- **问题反馈:** 提交 GitHub Issue

---

**准备就绪！开始部署吧！** 🚀

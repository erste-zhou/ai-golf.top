# GOLF AI TRACKER - PROJECT CONTEXT
# Update Date: 2025-12-20
# Status: STABLE (Register, Login, Dashboard, Add Score, StatsChart all working)

## 1. 项目架构 (Project Structure)

### 📂 Backend (Server)
**Path:** `/server`
**Tech Stack:** Node.js, Express, MongoDB (Mongoose), JWT Auth
**Key Files:**
- `index.js`: 入口文件，服务器启动，中间件配置。
- `middleware/auth.js`: JWT 验证中间件 (用于保护路由)。
- `models/User.js`: 用户数据模型 (包含 email, password, etc.)。
- `models/Scorecard.js`: 记分卡数据模型 (关联 User)。
- `routes/auth.js`: 处理注册 (/register) 和登录 (/login)。
- `routes/rounds.js`: 处理打球记录的 CRUD (增删改查) 及 AI 分析接口 (/analyze, /chat)。

### 📂 Frontend (Client)
**Path:** `/client`
**Tech Stack:** Vite, React, Tailwind CSS
**Key Components (`src/components/`):**
- `StatsChart.jsx`: **[核心组件]** 包含图表展示、历史记录表格(双行显示)、AI 对话窗口、编辑弹窗。
- `Navbar.jsx`: 顶部导航栏，包含退出登录逻辑。
- `AddScore.jsx`: (注意：这是组件版，若有) 用于复用的添加表单。

**Key Pages (`src/pages/`):**
- `Dashboard.jsx`: 仪表盘，引入了 `StatsChart`。
- `AddScore.jsx`: **[独立页面]** 完整的添加分数页面。
- `Login.jsx`: 登录页。
- `Register.jsx`: 注册页。
- `Home.jsx`: 首页/落地页。

**Config:**
- `src/App.jsx`: 路由配置 (React Router)。
- `src/main.jsx`: 全局入口。
- `tailwind.config.js`: 样式配置。

---

## 2. 环境变量配置 (Environment Variables)

**⚠️ Backend (.env in /server)**
*已配置并验证通过*
- `DEEPSEEK_API_KEY`: [已配置] DeepSeek V3 API (用于 AI 教练)
- `MONGO_URI`: [已配置] MongoDB Atlas 连接串 (golfcoach cluster)
- `PORT`: 3000 (默认)

**⚠️ Frontend (.env in /client)**
*已配置并验证通过*
- `VITE_WEATHER_API_KEY`: [已配置] WeatherAPI (用于获取天气信息)

---

## 3. 核心功能逻辑 (Key Logic)

1.  **数据流**: 
    - 前端通过 `fetch` 请求 `https://ai-golf-tracker.onrender.com/api/...`。
    - 所有受保护请求 Header 需携带 `Authorization: Bearer <token>`。
2.  **StatsChart 表格逻辑**:
    - 采用 `<React.Fragment>` 渲染。
    - **Row 1**: 日期 | 球场 | 天气 | 总杆 | 推杆 | GIR/FIR | OB | 操作按钮。
    - **Row 2**: (仅当 `score.notes` 存在时显示) 备注信息，跨列显示，灰色背景。
3.  **AI 分析**:
    - 后端 `/analyze`: 生成初始系统上下文 (System Context)。
    - 后端 `/chat`: 处理多轮对话，历史记录由前端 `chatHistory` 状态维护。

## 4. 当前任务/状态
- ✅ 注册/登录 (Auth) - OK
- ✅ 仪表盘数据展示 (Dashboard) - OK
- ✅ 添加成绩 (Add Score) - OK
- ✅ 历史记录列表 (含备注行) - OK
- ✅ AI 教练对话 - OK
- ⏳ 下一步计划: (待定，如移动端适配、部署等)

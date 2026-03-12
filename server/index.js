// ==========================================
// 1. 引入依赖
// ==========================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// ==========================================
// 2. 引入模型
// ==========================================
const User = require('./models/User');
const Scorecard = require('./models/Scorecard');

// ==========================================
// 3. 初始化
// ==========================================
const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(cors());

// ==========================================
// 4. 数据库连接
// ==========================================
const dbURI = "mongodb+srv://golfcoach:ibm00ibm@cluster0.omomlp0.mongodb.net/golf-tracker?retryWrites=true&w=majority&appName=Cluster0"; 

mongoose.connect(dbURI)
  .then(() => console.log("✅ MongoDB Atlas Connected Successfully!"))
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// ==========================================
// 5. 核心路由接口
// ==========================================

// --- A. 用户注册 ---
app.post('/register', async (req, res) => {
  try {
    let { name, email, password } = req.body;
    const cleanEmail = String(email).trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({ error: "该邮箱已被注册" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email: cleanEmail, 
      password: hashedPassword 
    });

    console.log(`✅ 用户注册成功: [${cleanEmail}]`);
    res.json(user);
  } catch (err) {
    console.error("❌ 注册报错:", err);
    res.status(500).json({ error: "注册失败: " + err.message });
  }
});

// --- B. 用户登录 ---
app.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;
    const cleanEmail = String(email).trim();
    
    const user = await User.findOne({ email: cleanEmail });
    if (!user) return res.status(404).json({ error: "用户不存在" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "密码错误" });

    const token = jwt.sign({ id: user._id, name: user.name }, "secret_key", { expiresIn: "1d" });
    
    console.log(`✅ 登录成功: [${cleanEmail}]`);
    res.json({ 
      message: "登录成功", 
      token, 
      user: { name: user.name, email: user.email } 
    });
  } catch (err) {
    console.error("❌ 登录报错:", err);
    res.status(500).json({ error: "登录失败: " + err.message });
  }
});

// --- C. 🌤️ 获取天气 ---
app.post('/get-weather-info', async (req, res) => {
  const { courseName } = req.body;
  if (!courseName) return res.status(400).json({ msg: '缺少球场名称' });

  try {
    const apiKey = process.env.WEATHER_API_KEY;
    const url = `http://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(courseName)}&days=1&lang=zh`;
    const response = await axios.get(url);
    const data = response.data;

    res.json({
      temp: `${data.current.temp_c}°C`,
      condition: data.current.condition.text,
      wind: `${data.current.wind_kph} km/h`,
      location: data.location.name 
    });
  } catch (error) {
    console.error('天气获取失败:', error.message);
    res.json({ temp: '未知', condition: '未知', wind: '未知' });
  }
});

// --- D. ⛳️ 新增成绩 (核心修复版) ---
// 整合了你 routes 里的逻辑，彻底解决 next 报错和数据丢失问题
app.post('/add-score', async (req, res) => {
  try {
    console.log("📝 收到成绩上传请求:", req.body.email);

    // 1. 解构所有可能传过来的参数
    const { 
      email, courseName, date, tees,
      holes, // 详细模式下的每洞数据
      frontNine, backNine, totalScore, 
      totalPutts, fairwaysHit, threePutts, totalGir, totalOb,
      // 成绩分布字段
      doubleBogeys, bogeys, pars, birdies, eagles,
      weather, notes 
    } = req.body;

    if (!email) return res.status(400).json({ error: "必须提供用户邮箱" });

    // 2. 构造数据对象
    const scoreData = {
      email,
      courseName,
      date,
      tees: tees || 'Blue',
      weather,
      notes,
      holes: holes || [], // 即使是简单模式，这里也是个空数组，防止报错
      
      // 3. 强制数字转换 (防止 null 或字符串导致数据库错误)
      // 使用 || 0 确保如果不填就是 0
      frontNine: Number(frontNine) || 0,
      backNine: Number(backNine) || 0,
      totalScore: Number(totalScore) || 0,
      totalPutts: Number(totalPutts) || 0,
      fairwaysHit: Number(fairwaysHit) || 0,
      threePutts: Number(threePutts) || 0,
      totalGir: Number(totalGir) || 0,
      totalOb: Number(totalOb) || 0,
      // 成绩分布字段
      doubleBogeys: Number(doubleBogeys) || 0,
      bogeys: Number(bogeys) || 0,
      pars: Number(pars) || 0,
      birdies: Number(birdies) || 0,
      eagles: Number(eagles) || 0
    };

    // 4. 保存到数据库
    const newScore = new Scorecard(scoreData);
    const savedScore = await newScore.save();

    console.log("✅ 成绩保存成功 ID:", savedScore._id);
    res.status(201).json({ message: '成绩记录成功！', data: savedScore });

  } catch (error) {
    console.error("❌ 保存成绩失败:", error);
    // 绝对不调用 next，直接返回错误响应
    res.status(500).json({ error: '服务器保存失败', details: error.message });
  }
});

// --- E. 获取成绩列表 ---
app.get('/scores', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: "缺少邮箱参数" });

    const cleanEmail = String(email).trim(); 
    const scores = await Scorecard.find({ email: cleanEmail }).sort({ date: -1 }); // 按日期倒序
    res.json(scores);
  } catch (err) {
    console.error("获取成绩失败:", err);
    res.status(500).json({ error: err.message });
  }
});

// --- F. 获取单场详情 (点击查看使用) ---
app.get('/score-detail/:id', async (req, res) => {
    try {
        const score = await Scorecard.findById(req.params.id);
        if (!score) return res.status(404).json({ error: '未找到该场次记录' });
        res.json(score);
    } catch (err) {
        res.status(500).json({ error: '获取详情失败' });
    }
});

// --- G. 删除成绩 ---
app.delete('/delete-score/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedScore = await Scorecard.findByIdAndDelete(id);
    if (!deletedScore) return res.status(404).json({ error: "未找到该记录" });
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- H. 更新成绩 ---
app.put('/update-score/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedScore = await Scorecard.findByIdAndUpdate(
      id,
      { ...req.body }, // 直接把前端传来的所有字段更新进去
      { new: true } 
    );
    if (!updatedScore) return res.status(404).json({ error: "未找到该记录" });
    console.log(`✅ 成绩更新成功 ID: ${id}`);
    res.json({ message: 'Update successfully', data: updatedScore });
  } catch (err) {
    console.error("❌ 更新成绩失败:", err);
    res.status(500).json({ error: "更新失败: " + err.message });
  }
});

// ==========================================
// 6. AI 智能分析模块
// ==========================================

// --- AI 概况分析 ---
app.post('/analyze', async (req, res) => {
  const { email } = req.body;
  try {
    const cleanEmail = String(email).trim();
    // 取最近5场数据
    const recentGames = await Scorecard.find({ email: cleanEmail }).sort({ date: -1 }).limit(5);

    if (recentGames.length === 0) {
      return res.json({ suggestion: "请先记录至少一场比赛数据，教练才能开始分析哦！" });
    }

    const gameDataText = recentGames.map((g, index) => {
      return `第${index + 1}场 (${g.date}): 球场-${g.courseName}, 总杆-${g.totalScore}, 推杆-${g.totalPutts}, OB-${g.totalOb}, GIR-${g.totalGir}, 备注: "${g.notes || '无'}"`;
    }).join('\n');

    const systemPrompt = `
      你是一位专业、严厉但富有洞察力的高尔夫教练。
      这是学员最近${recentGames.length}场的表现：
      ${gameDataText}
      请分析：1.技术状态趋势 2.心理状态 3.给出3条针对性训练建议。
    `;

    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: [
        {"role": "system", "content": "You are a helpful golf coach assistant."},
        {"role": "user", "content": systemPrompt}
      ],
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    });

    res.json({ 
      suggestion: response.data.choices[0].message.content,
      systemContext: systemPrompt 
    });
  } catch (error) {
    console.error("AI 分析出错:", error);
    res.status(500).json({ error: "教练正在忙线中，请稍后再试。" });
  }
});

// --- AI 聊天对话 ---
app.post('/chat', async (req, res) => {
  const { messages } = req.body; 
  try {
    const response = await axios.post('https://api.deepseek.com/chat/completions', {
      model: "deepseek-chat",
      messages: messages,
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      }
    });
    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("对话出错:", error);
    res.status(500).json({ error: "消息发送失败" });
  }
});

// ==========================================
// 7. 启动服务器
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

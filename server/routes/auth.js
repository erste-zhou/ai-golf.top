const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @路径   POST /api/auth/register
// @描述   注册用户
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. 检查用户是否存在
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ msg: '用户名已存在' });
    }

    // 2. 创建新用户对象
    user = new User({ username, password });

    // 3. 密码加密
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // 4. 保存到数据库
    await user.save();

    // 5. 生成 Token (手环)
    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'mysecrettoken', { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({ token }); // 返回 token 给前端
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

// @路径   POST /api/auth/login
// @描述   登陆用户
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // 1. 找用户
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ msg: '用户不存在' });
    }

    // 2. 比对密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: '密码错误' });
    }

    // 3. 生成 Token
    const payload = { user: { id: user.id } };
    jwt.sign(payload, 'mysecrettoken', { expiresIn: '5d' }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('服务器错误');
  }
});

module.exports = router;

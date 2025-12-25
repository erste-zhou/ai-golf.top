const jwt = require('jsonwebtoken');

// 下面这个函数就是“保安”
module.exports = function(req, res, next) {
  // 1. 从请求头里拿 token
  const token = req.header('x-auth-token');

  // 2. 如果没有 token，直接拒绝
  if (!token) {
    return res.status(401).json({ msg: '无权访问，请先登陆' });
  }

  // 3. 验证 token 是否伪造
  try {
    // 这里的 'mysecrettoken' 是加密密钥，后面要和生成时保持一致
    const decoded = jwt.verify(token, 'mysecrettoken'); 
    req.user = decoded.user; // 把解密出来的用户ID塞给请求
    next(); // 放行
  } catch (err) {
    res.status(401).json({ msg: 'Token 无效' });
  }
};

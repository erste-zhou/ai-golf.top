// server/models/User.js
const mongoose = require('mongoose');

// 定义用户的结构
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true // 必填
    },
    email: {
        type: String,
        required: true,
        unique: true // 唯一，不能重复注册
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now // 默认设为当前注册时间
    }
});

// 导出模型，名字叫 'User'
module.exports = mongoose.model('User', UserSchema);

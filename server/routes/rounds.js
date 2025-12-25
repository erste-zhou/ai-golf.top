const express = require('express');
const router = express.Router();
const Scorecard = require('../models/Scorecard');

// POST /add-score
router.post('/add-score', async (req, res) => {
    try {
        console.log("📝 收到前端数据:", req.body.email); // 打印关键信息即可

        // 1. 解构数据
        const { 
            email, courseName, date, tees, holes, weather, notes,
            // 下面这些可能是字符串，需要转换
            frontNine, backNine, totalScore, totalPutts, fairwaysHit, threePutts, totalGir, totalOb,
            // ✅ 新增这四个字段
            doubleBogeys, pars, birdies, bogeys
        } = req.body;

        // 2. 构造基础数据对象
        const scoreData = {
            email,
            courseName,
            date,
            tees: tees || 'Blue',
            weather,
            notes,
            holes: holes || [] // 即使没有也是空数组，为了安全
        };

        // 3. 【关键修复】强制数字类型转换
        // 无论前端传的是 "85" (String) 还是 85 (Number)，这里都转成 Number
        // 如果是 undefined 或 null，就转成 0，防止报错
        scoreData.frontNine = Number(frontNine) || 0;
        scoreData.backNine = Number(backNine) || 0;
        scoreData.totalScore = Number(totalScore) || 0;
        scoreData.totalPutts = Number(totalPutts) || 0;
        scoreData.fairwaysHit = Number(fairwaysHit) || 0;
        scoreData.threePutts = Number(threePutts) || 0;
        scoreData.totalGir = Number(totalGir) || 0;
        scoreData.totalOb = Number(totalOb) || 0;
        // ✅ 新增：这四个字段也必须转换
        scoreData.doubleBogeys = Number(doubleBogeys) || 0;
        scoreData.pars = Number(pars) || 0;
        scoreData.birdies = Number(birdies) || 0;
        scoreData.bogeys = Number(bogeys) || 0;

        // 注意：这里不需要再写 if/else 判断是简单还是详细模式了
        // 因为如果 holes 有数据，Model 里的 pre-save 钩子会自动重算这些值并覆盖掉上面的 0
        // 如果 holes 没数据，上面的 0 (或前端传的值) 就会被保留
        // 这样代码更简洁、更不容易出错。

        // 4. 创建并保存
        const newScore = new Scorecard(scoreData);
        const savedScore = await newScore.save();

        console.log("✅ 保存成功 ID:", savedScore._id);
        // ✅ 添加日志，确认四个字段已保存
        console.log("✅ 爆洞等字段:", {
            doubleBogeys: savedScore.doubleBogeys,
            pars: savedScore.pars,
            birdies: savedScore.birdies,
            bogeys: savedScore.bogeys
        });
        
        res.status(201).json({ message: '成绩记录成功！', data: savedScore });

    } catch (err) {
        console.error("❌ 保存成绩出错:", err);
        // 绝对不要调用 next(err)，直接返回 JSON
        res.status(500).json({ error: '保存失败', details: err.message });
    }
});
const express = require('express');
const router = express.Router();
const Scorecard = require('../models/Scorecard');

// POST /add-score - 添加新成绩
router.post('/add-score', async (req, res) => {
  try {
    console.log("🎯 === 开始处理/add-score请求 ===");
    console.log("📦 收到前端数据 - 完整req.body:", JSON.stringify(req.body, null, 2));
    
    // 1. 检查所有字段
    console.log("🔍 检查req.body所有键:", Object.keys(req.body));
    
    // 2. 特别检查5个关键字段
    console.log("🔍 检查5个关键字段:");
    const criticalFields = ['doubleBogeys', 'bogeys', 'pars', 'birdies', 'eagles'];
    criticalFields.forEach(key => {
      const exists = key in req.body;
      const value = req.body[key];
      console.log(`  ${key}: 存在=${exists}, 值=${value}, 类型=${typeof value}`);
    });
    
    // 3. 解构所有字段
    const {
      email, 
      courseName, 
      date, 
      tees,
      holes,
      frontNine, 
      backNine, 
      totalScore, 
      totalPutts,
      threePutts, 
      fairwaysHit, 
      totalOb, 
      totalGir,
      // 统计字段
      doubleBogeys,
      bogeys,  
      pars,
      birdies,
      eagles,
      weather, 
      notes
    } = req.body;
    
    // 4. 检查解构后的值
    console.log("🔍 解构后的5个字段值:");
    console.log(`  doubleBogeys=${doubleBogeys} (类型: ${typeof doubleBogeys})`);
    console.log(`  bogeys=${bogeys} (类型: ${typeof bogeys})`);
    console.log(`  pars=${pars} (类型: ${typeof pars})`);
    console.log(`  birdies=${birdies} (类型: ${typeof birdies})`);
    console.log(`  eagles=${eagles} (类型: ${typeof eagles})`);
    
    // 5. 构造数据库对象
    console.log("🔍 开始构造scoreData...");
    
    const scoreData = {
      email,
      courseName,
      date,
      tees: tees || 'Blue',
      
      // 统计字段 - 详细记录转换过程
      doubleBogeys: (() => {
        const num = Number(doubleBogeys);
        console.log(`  doubleBogeys转换: "${doubleBogeys}" -> Number() = ${num} -> || 0 = ${num || 0}`);
        return num || 0;
      })(),
      
      bogeys: (() => {
        const num = Number(bogeys);
        console.log(`  bogeys转换: "${bogeys}" -> Number() = ${num} -> || 0 = ${num || 0}`);
        return num || 0;
      })(),
      
      pars: (() => {
        const num = Number(pars);
        console.log(`  pars转换: "${pars}" -> Number() = ${num} -> || 0 = ${num || 0}`);
        return num || 0;
      })(),
      
      birdies: (() => {
        const num = Number(birdies);
        console.log(`  birdies转换: "${birdies}" -> Number() = ${num} -> || 0 = ${num || 0}`);
        return num || 0;
      })(),
      
      eagles: (() => {
        const num = Number(eagles);
        console.log(`  eagles转换: "${eagles}" -> Number() = ${num} -> || 0 = ${num || 0}`);
        return num || 0;
      })(),
      
      // 其他字段
      frontNine: Number(frontNine) || 0,
      backNine: Number(backNine) || 0,
      totalScore: Number(totalScore) || 0,
      totalPutts: Number(totalPutts) || 0,
      threePutts: Number(threePutts) || 0,
      fairwaysHit: Number(fairwaysHit) || 0,
      totalOb: Number(totalOb) || 0,
      totalGir: Number(totalGir) || 0,
      holes: holes || [],
      weather: weather || {},
      notes: notes || ""
    };
    
    console.log("🔍 最终scoreData中的5个字段值:");
    console.log(`  doubleBogeys=${scoreData.doubleBogeys}`);
    console.log(`  bogeys=${scoreData.bogeys}`);
    console.log(`  pars=${scoreData.pars}`);
    console.log(`  birdies=${scoreData.birdies}`);
    console.log(`  eagles=${scoreData.eagles}`);
    
    console.log("💾 开始创建Scorecard文档...");
    
    // 6. 保存到数据库
    const newScore = new Scorecard(scoreData);
    
    console.log("💾 保存前文档内容:", JSON.stringify(newScore.toObject(), null, 2));
    
    await newScore.save();
    
    console.log("✅ 保存成功，文档ID:", newScore._id);
    
    // 7. 从数据库重新读取验证
    const savedDoc = await Scorecard.findById(newScore._id);
    console.log("🔍 从数据库读取的实际值:");
    console.log(`  doubleBogeys=${savedDoc.doubleBogeys}`);
    console.log(`  bogeys=${savedDoc.bogeys}`);
    console.log(`  pars=${savedDoc.pars}`);
    console.log(`  birdies=${savedDoc.birdies}`);
    console.log(`  eagles=${savedDoc.eagles}`);
    
    console.log("🎯 === /add-score请求处理完成 ===");
    
    res.status(201).json({ message: "成绩保存成功", score: newScore });
  } catch (error) {
    console.error("❌ 保存成绩错误:", error);
    console.error("❌ 错误堆栈:", error.stack);
    res.status(500).json({ message: "保存失败", error: error.message });
  }
});

// GET /scores - 获取用户成绩
router.get('/scores', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email参数必填' });
    }
    
    const scores = await Scorecard.find({ email }).sort({ date: -1 });
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: '获取数据失败', error: error.message });
  }
});

// DELETE /delete-score/:id - 删除成绩
router.delete('/delete-score/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Scorecard.findByIdAndDelete(id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除失败', error: error.message });
  }
});

module.exports = router;
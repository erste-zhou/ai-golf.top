router.post('/add-score', async (req, res) => {
  try {
    console.log("收到前端数据:", req.body);
    
    // 1. 正确解构所有字段（必须跟前端提交的字段名完全一致）
    const {
      email, 
      courseName, 
      date, 
      tees,  // 不是 tces
      holes,  // 不是 hole
      // 成绩字段
      frontNine, 
      backNine, 
      totalScore, 
      totalPutts,  // 不是 to
      threePutts, 
      fairwaysHit, 
      totalOb, 
      totalGir,
      // 统计字段（必须跟前端一致）
      doubleBogeys,  // 不是 doubleBogey3
      bogeys,        // 不是 bogey3  
      pars, 
      birdies, 
      eagles,        // 必须要有这个字段！
      // 其他字段
      weather, 
      notes
    } = req.body;
    
    // 2. 调试：打印这些字段的值
    console.log("统计字段值:", {
      doubleBogeys,
      bogeys, 
      pars, 
      birdies, 
      eagles
    });
    
    // 3. 构造数据库对象
    const scoreData = {
      email,
      courseName,
      date,
      tees: tees || 'Blue',
      // 确保统计字段正确传递
      doubleBogeys: Number(doubleBogeys) || 0,
      bogeys: Number(bogeys) || 0,
      pars: Number(pars) || 0,
      birdies: Number(birdies) || 0,
      eagles: Number(eagles) || 0,
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
    
    console.log("最终保存的数据:", scoreData);
    
    // 4. 保存到数据库
    const newScore = new Scorecard(scoreData);
    await newScore.save();
    
    res.status(201).json({ message: "成绩保存成功", score: newScore });
  } catch (error) {
    console.error("保存成绩错误:", error);
    res.status(500).json({ message: "保存失败", error: error.message });
  }
});
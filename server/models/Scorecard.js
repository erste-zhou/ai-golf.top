const mongoose = require('mongoose');

const autoZero = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const num = Number(v);
  if (isNaN(num)) return 0;
  return num;
};

const HoleSchema = new mongoose.Schema({
  number: { type: Number, set: autoZero }, 
  par: { type: Number, set: autoZero },    
  score: { type: Number, set: autoZero },  
  putts: { type: Number, default: 0, set: autoZero },
  fairwayHit: { type: Boolean, default: null },
  gir: { type: Boolean, default: false }
}, { _id: false });

const ScorecardSchema = new mongoose.Schema({
  // 1. 基础信息
  email: { type: String, required: true },
  courseName: { type: String },
  date: { type: String },
  tees: { type: String, default: 'Blue' },
  
  // 2. 总分与分段成绩
  totalScore: { type: Number, default: 0, set: autoZero },
  frontNine: { type: Number, default: 0, set: autoZero },
  backNine: { type: Number, default: 0, set: autoZero },
  
  // 3. 推杆统计
  totalPutts: { type: Number, default: 0, set: autoZero },
  threePutts: { type: Number, default: 0, set: autoZero },
  
  // 4. 击球准确度统计
  fairwaysHit: { type: Number, default: 0, set: autoZero },
  totalGir: { type: Number, default: 0, set: autoZero },
  
  // 5. 失误统计
  totalOb: { type: Number, default: 0, set: autoZero },
  
  // 6. 成绩分布（由前端计算后传入）
  eagles: { type: Number, default: 0, set: autoZero },
  birdies: { type: Number, default: 0, set: autoZero },
  pars: { type: Number, default: 0, set: autoZero },
  bogeys: { type: Number, default: 0, set: autoZero },
  doubleBogeys: { type: Number, default: 0, set: autoZero },
  
  // 7. 详细数据
  holes: [HoleSchema],
  isDetailed: { type: Boolean, default: false },
  
  // 8. 环境与备注
  weather: { 
    temp: String, 
    condition: String, 
    wind: String, 
    location: String 
  },
  notes: { type: String }
  
}, { timestamps: true });

// 保存前的计算逻辑（只计算基础统计，不覆盖前端传的分布数据）
ScorecardSchema.pre('save', function(next) {
  if (typeof next !== 'function') return;
  
  try {
    if (this.holes && this.holes.length > 0) {
      this.isDetailed = true;
      const validHoles = this.holes;
      
      // 只计算基础数据，不重新计算成绩分布
      this.frontNine = validHoles.slice(0, 9).reduce((sum, h) => sum + (h.score || 0), 0);
      this.backNine = validHoles.length > 9 ? 
        validHoles.slice(9, 18).reduce((sum, h) => sum + (h.score || 0), 0) : 0;
      
      // 如果总分为0，重新计算（但优先使用前端传的）
      if (!this.totalScore || this.totalScore === 0) {
        this.totalScore = this.frontNine + this.backNine;
      }
      
      // 计算推杆相关
      let puttsCount = 0, threePuttsCount = 0;
      validHoles.forEach(h => {
        const p = h.putts || 0;
        puttsCount += p;
        if (p >= 3) threePuttsCount++;
      });
      this.totalPutts = puttsCount;
      this.threePutts = threePuttsCount;
      
      // 计算击球准确度
      let girCount = 0, fairwayCount = 0;
      validHoles.forEach(h => {
        if (h.gir) girCount++;
        if (h.fairwayHit) fairwayCount++;
      });
      this.totalGir = girCount;
      this.fairwaysHit = fairwayCount;
      
      // 不再重新计算 eagles, birdies, pars, bogeys, doubleBogeys
      // 完全信任前端传来的值
    }
  } catch (e) { 
    console.error('保存前计算错误:', e);
  }
  
  next();
});

module.exports = mongoose.model('Scorecard', ScorecardSchema);
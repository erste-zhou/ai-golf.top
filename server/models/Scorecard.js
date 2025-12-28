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
  // 1. 基础信息（只有tees有默认值）
  email: { type: String, required: true },
  courseName: { type: String },
  date: { type: String },
  tees: { type: String, default: 'Blue' }, // ✅ 唯一有默认值的字段（除了email）
  
  // 2. 所有成绩字段都由前端传入，后端不重新计算
  frontNine: { type: Number, default: 0, set: autoZero }, 
  backNine: { type: Number, default: 0, set: autoZero },  
  totalScore: { type: Number, default: 0, set: autoZero },
  
  // 3. 所有推杆统计都由前端传入
  totalPutts: { type: Number, default: 0, set: autoZero },
  threePutts: { type: Number, default: 0, set: autoZero },
  
  // 4. 所有击球准确度都由前端传入
  fairwaysHit: { type: Number, default: 0, set: autoZero },
  totalGir: { type: Number, default: 0, set: autoZero },
  
  // 5. 失误统计由前端传入
  totalOb: { type: Number, default: 0, set: autoZero },
  
  // 6. 成绩分布由前端传入
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

// ❌ 完全移除 pre('save') 钩子！让前端完全控制数据
// 或者只保留最简单的逻辑：

ScorecardSchema.pre('save', function(next) {
  if (typeof next !== 'function') return;
  
  try {
    // 只做最简单的标记，不做计算
    if (this.holes && this.holes.length > 0) {
      this.isDetailed = true;
    }
  } catch (e) { 
    console.error('保存错误:', e);
  }
  
  next();
});

module.exports = mongoose.model('Scorecard', ScorecardSchema);
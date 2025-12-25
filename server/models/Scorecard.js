const mongoose = require('mongoose');

const autoZero = (v) => {
  if (v === '' || v === null || v === undefined) return 0;
  const num = Number(v);
  if (isNaN(num)) return 0;
  return num;
};

const HoleSchema = new mongoose.Schema({
  holeNumber: { type: Number, required: true, set: autoZero }, 
  par: { type: Number, default: 4, set: autoZero },    
  score: { type: Number, default: 0, set: autoZero },  
  putts: { type: Number, default: 0, set: autoZero },
  fairway: { type: Boolean, default: false },
  gir: { type: Boolean, default: false },
  ob: { type: Number, default: 0, set: autoZero }
}, { _id: false });

const ScorecardSchema = new mongoose.Schema({
  email: { type: String, required: true },
  courseName: { type: String, required: true },
  date: { type: String, required: true },
  tees: { type: String, default: 'Blue' }, 
  
  // 基础数据 - 由前端计算并传递
  frontNine: { type: Number, default: 0, set: autoZero }, 
  backNine: { type: Number, default: 0, set: autoZero },  
  totalScore: { type: Number, default: 0, set: autoZero },
  totalPutts: { type: Number, default: 0, set: autoZero },
  threePutts: { type: Number, default: 0, set: autoZero },    
  fairwaysHit: { type: Number, default: 0, set: autoZero },   
  totalOb: { type: Number, default: 0, set: autoZero },
  totalGir: { type: Number, default: 0, set: autoZero },
  
  // 成绩分布数据 - 由前端计算并传递
  doubleBogeys: { type: Number, default: 0, set: autoZero },  // 爆洞 (≥+2)
  pars: { type: Number, default: 0, set: autoZero },          // Par洞 (=0)
  birdies: { type: Number, default: 0, set: autoZero },       // 鸟洞 (-1)
  bogeys: { type: Number, default: 0, set: autoZero },        // 鸡洞 (+1)
  eagles: { type: Number, default: 0, set: autoZero },        // 老鹰洞 (-2)
  
  // 每洞详细数据 - 可选，如果存在则表示是详细记录
  holes: [HoleSchema],
  
  // 计算统计数据 - 由前端计算并传递，用于快速查询
  calculatedStats: {
    totalScore: { type: Number, default: 0 },
    totalPutts: { type: Number, default: 0 },
    threePutts: { type: Number, default: 0 },
    fairwaysHit: { type: Number, default: 0 },
    totalGir: { type: Number, default: 0 },
    totalOb: { type: Number, default: 0 },
    doubleBogeys: { type: Number, default: 0 },
    bogeys: { type: Number, default: 0 },
    pars: { type: Number, default: 0 },
    birdies: { type: Number, default: 0 },
    eagles: { type: Number, default: 0 },
    frontNine: { type: Number, default: 0 },
    backNine: { type: Number, default: 0 }
  },
  
  // 天气信息 - 可选
  weather: { 
    condition: { type: String, default: '' },
    temp: { type: String, default: '' },
    wind: { type: String, default: '' }
  },
  
  // 备注
  notes: { type: String, default: '' }
  
}, { 
  timestamps: true,
  // 禁用版本键，简化数据结构
  versionKey: false
});

// 移除所有计算逻辑的 pre-save 钩子
// 只做数据验证和简单转换
ScorecardSchema.pre('save', function(next) {
  if (typeof next !== 'function') return;
  
  try {
    // 确保 calculatedStats 与主数据同步（如果前端没有提供calculatedStats）
    if (!this.calculatedStats || Object.keys(this.calculatedStats).length === 0) {
      this.calculatedStats = {
        totalScore: this.totalScore || 0,
        totalPutts: this.totalPutts || 0,
        threePutts: this.threePutts || 0,
        fairwaysHit: this.fairwaysHit || 0,
        totalGir: this.totalGir || 0,
        totalOb: this.totalOb || 0,
        doubleBogeys: this.doubleBogeys || 0,
        bogeys: this.bogeys || 0,
        pars: this.pars || 0,
        birdies: this.birdies || 0,
        eagles: this.eagles || 0,
        frontNine: this.frontNine || 0,
        backNine: this.backNine || 0
      };
    }
    
    // 如果提供了 holes 数据，确保每洞都有 holeNumber
    if (this.holes && this.holes.length > 0) {
      this.holes = this.holes.map((hole, index) => ({
        ...hole,
        holeNumber: hole.holeNumber || index + 1,
        par: hole.par || 4,
        score: hole.score || 0,
        putts: hole.putts || 0,
        ob: hole.ob || 0,
        fairway: Boolean(hole.fairway),
        gir: Boolean(hole.gir)
      }));
    }
    
    // 清理 weather 对象，如果所有字段都为空则设置为 undefined
    if (this.weather) {
      const hasWeatherData = this.weather.condition || this.weather.temp || this.weather.wind;
      if (!hasWeatherData) {
        this.weather = undefined;
      }
    }
    
  } catch (e) { 
    console.error('Scorecard 保存前处理错误:', e); 
  }
  
  next();
});

// 创建索引以提高查询效率
ScorecardSchema.index({ email: 1, date: -1 });
ScorecardSchema.index({ email: 1, courseName: 1 });
ScorecardSchema.index({ email: 1, totalScore: 1 });

// 添加一个虚拟字段来判断是否是详细记录
ScorecardSchema.virtual('isDetailed').get(function() {
  return this.holes && this.holes.length === 18;
});

// 设置虚拟字段在转换为JSON时包含
ScorecardSchema.set('toJSON', { virtuals: true });
ScorecardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Scorecard', ScorecardSchema);
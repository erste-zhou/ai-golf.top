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
  strokes: { type: Number, set: autoZero },  
  putts: { type: Number, default: 0, set: autoZero },
  fairway: { type: Boolean, default: false },
  gir: { type: Boolean, default: false },
  ob: { type: Number, default: 0, set: autoZero }
}, { _id: false });

const ScorecardSchema = new mongoose.Schema({
  email: { type: String, required: true },
  courseName: { type: String },
  date: { type: String },
  tees: { type: String, default: 'Blue' }, 
  frontNine: { type: Number, default: 0, set: autoZero }, 
  backNine: { type: Number, default: 0, set: autoZero },  
  totalScore: { type: Number, default: 0, set: autoZero },
  totalPutts: { type: Number, default: 0, set: autoZero },
  threePutts: { type: Number, default: 0, set: autoZero },    
  fairwaysHit: { type: Number, default: 0, set: autoZero },   
  totalOb: { type: Number, default: 0, set: autoZero },
  totalGir: { type: Number, default: 0, set: autoZero },
  
  // 新增：四个统计字段
  doubleBogeys: { type: Number, default: 0, set: autoZero },  // 爆洞 (≥+2)
  pars: { type: Number, default: 0, set: autoZero },          // Par洞 (=0)
  birdies: { type: Number, default: 0, set: autoZero },       // 鸟洞 (-1)
  bogeys: { type: Number, default: 0, set: autoZero },        // 鸡洞 (+1)
  
  holes: [HoleSchema],
  isDetailed: { type: Boolean, default: false },
  weather: { 
    temp: String, 
    condition: String, 
    wind: String, 
    location: String 
  },
  notes: { type: String }
}, { timestamps: true });

ScorecardSchema.pre('save', function(next) {
  if (typeof next !== 'function') return;
  
  try {
    // 如果有详细洞数据，自动计算统计字段
    if (this.holes && this.holes.length > 0) {
      this.isDetailed = true;
      
      const validHoles = this.holes.filter(h => h.strokes > 0);
      
      // 计算前九和后九成绩
      this.frontNine = validHoles.slice(0, 9).reduce((sum, h) => sum + (h.strokes || 0), 0);
      this.backNine = validHoles.length > 9 ? validHoles.slice(9, 18).reduce((sum, h) => sum + (h.strokes || 0), 0) : 0;
      
      // 计算总杆数
      if (!this.totalScore || this.totalScore === 0) {
        this.totalScore = this.frontNine + this.backNine;
      }
      
      // 初始化统计变量
      let puttsCount = 0, threePuttsCount = 0, girCount = 0, fairwayCount = 0;
      let doubleBogeysCount = 0, parsCount = 0, birdiesCount = 0, bogeysCount = 0;
      let obCount = 0;
      
      // 遍历每个洞计算统计数据
      validHoles.forEach(h => {
        const putts = h.putts || 0;
        const strokes = h.strokes || 0;
        const par = h.par || 4;
        
        // 推杆统计
        puttsCount += putts;
        if (putts >= 3) threePuttsCount++;
        
        // GIR统计
        if (h.gir) girCount++;
        
        // FIR统计
        if (h.fairway) fairwayCount++;
        
        // OB统计
        if (h.ob && h.ob > 0) {
          obCount += h.ob;
        }
        
        // 计算爆洞、Par洞、鸟洞、鸡洞
        if (strokes > 0) {
          const diff = strokes - par;
          
          if (diff >= 2) {
            doubleBogeysCount++; // 爆洞：大于等于标准杆2杆
          } else if (diff === 1) {
            bogeysCount++; // 鸡洞：大于标准杆1杆
          } else if (diff === 0) {
            parsCount++; // Par洞：标准杆
          } else if (diff === -1) {
            birdiesCount++; // 鸟洞：小于标准杆1杆
          }
          // 注意：暂时不考虑老鹰洞（-2）及其他情况
        }
      });
      
      // 设置统计字段
      this.totalPutts = puttsCount;
      this.threePutts = threePuttsCount;
      this.totalGir = girCount;
      this.fairwaysHit = fairwayCount;
      this.totalOb = obCount;
      
      // 设置新增的四个字段
      this.doubleBogeys = doubleBogeysCount;
      this.pars = parsCount;
      this.birdies = birdiesCount;
      this.bogeys = bogeysCount;
    }
    
    // 对于整场模式（没有详细洞数据），确保字段有默认值
    if (!this.holes || this.holes.length === 0) {
      this.isDetailed = false;
      
      // 设置默认值为0或前端传入的值
      this.doubleBogeys = this.doubleBogeys || 0;
      this.pars = this.pars || 0;
      this.birdies = this.birdies || 0;
      this.bogeys = this.bogeys || 0;
    }
    
  } catch (e) { 
    console.error('Scorecard保存前处理错误:', e); 
  }
  
  next();
});

// 创建索引以提高查询效率
ScorecardSchema.index({ email: 1, date: -1 });
ScorecardSchema.index({ email: 1, courseName: 1 });

module.exports = mongoose.model('Scorecard', ScorecardSchema);
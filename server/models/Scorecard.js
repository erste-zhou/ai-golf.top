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
  
  // ✅ 只添加这些成绩分布字段（完全不影响原有结构）
  doubleBogeys: { type: Number, default: 0, set: autoZero },  // 爆洞 (≥+2)
  bogeys: { type: Number, default: 0, set: autoZero },        // 鸡洞 (+1)
  pars: { type: Number, default: 0, set: autoZero },          // PAR洞 (=0)
  birdies: { type: Number, default: 0, set: autoZero },       // 鸟洞 (-1)
  eagles: { type: Number, default: 0, set: autoZero },        // 老鹰洞 (-2)
  
  holes: [HoleSchema],
  isDetailed: { type: Boolean, default: false },
  weather: { temp: String, condition: String, wind: String, location: String },
  notes: { type: String }
}, { timestamps: true });

ScorecardSchema.pre('save', function(next) {
  if (typeof next !== 'function') return;
  try {
    if (this.holes && this.holes.length > 0) {
      this.isDetailed = true;
      const validHoles = this.holes; 
      this.frontNine = validHoles.slice(0, 9).reduce((sum, h) => sum + (h.score || 0), 0);
      this.backNine = validHoles.length > 9 ? validHoles.slice(9, 18).reduce((sum, h) => sum + (h.score || 0), 0) : 0;
      if (!this.totalScore || this.totalScore === 0) {
        this.totalScore = this.frontNine + this.backNine;
      }
      let puttsCount = 0, threePuttsCount = 0, girCount = 0, fairwayCount = 0;
      validHoles.forEach(h => {
        const p = h.putts || 0;
        puttsCount += p;
        if (p >= 3) threePuttsCount++;
        if (h.gir) girCount++;
        if (h.fairwayHit) fairwayCount++;
      });
      this.totalPutts = puttsCount;
      this.threePutts = threePuttsCount;
      this.totalGir = girCount;
      this.fairwaysHit = fairwayCount;
    }
  } catch (e) { console.log(e); }
  next();
});

module.exports = mongoose.model('Scorecard', ScorecardSchema);
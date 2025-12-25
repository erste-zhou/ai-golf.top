import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceTextarea from './VoiceTextarea';

// 辅助函数：从每洞数据计算所有统计数据
const calculateStatsFromHoles = (holes) => {
  if (!holes || holes.length !== 18) {
    return {
      totalScore: 0,
      totalPutts: 0,
      threePutts: 0,
      fairwaysHit: 0,
      totalGir: 0,
      totalOb: 0,
      doubleBogeys: 0,
      bogeys: 0,
      pars: 0,
      birdies: 0,
      eagles: 0,
      frontNine: 0,
      backNine: 0
    };
  }
  
  let totalScore = 0;
  let totalPutts = 0;
  let threePutts = 0;
  let fairwaysHit = 0;
  let totalGir = 0;
  let totalOb = 0;
  let doubleBogeys = 0;
  let bogeys = 0;
  let pars = 0;
  let birdies = 0;
  let eagles = 0;
  
  // 计算总的FIR机会（只有4杆洞和5杆洞）
  let firOpportunities = 0;
  
  holes.forEach((hole, index) => {
    const { score = 0, putts = 0, par = 4, ob = 0, fairway = false, gir = false } = hole;
    
    // 累加基本数据
    totalScore += Number(score) || 0;
    totalPutts += Number(putts) || 0;
    totalOb += Number(ob) || 0;
    
    // 计算3推洞
    if (Number(putts) >= 3) threePutts++;
    
    // 计算FIR机会（只有4杆洞和5杆洞）
    if (Number(par) >= 4) {
      firOpportunities++;
      if (fairway) {
        fairwaysHit++;
      }
    }
    
    // 计算GIR
    if (gir) {
      totalGir++;
    }
    
    // 计算成绩类型
    const scoreDiff = (Number(score) || 0) - (Number(par) || 4);
    
    if (scoreDiff <= -2) {
      eagles++;
    } else if (scoreDiff === -1) {
      birdies++;
    } else if (scoreDiff === 0) {
      pars++;
    } else if (scoreDiff === 1) {
      bogeys++;
    } else if (scoreDiff >= 2) {
      doubleBogeys++;
    }
  });
  
  // 计算前后九
  const frontNine = holes.slice(0, 9).reduce((sum, hole) => sum + (Number(hole.score) || 0), 0);
  const backNine = holes.slice(9).reduce((sum, hole) => sum + (Number(hole.score) || 0), 0);
  
  return {
    totalScore,
    totalPutts,
    threePutts,
    fairwaysHit,
    totalGir,
    totalOb,
    doubleBogeys,
    bogeys,
    pars,
    birdies,
    eagles,
    frontNine,
    backNine
  };
};

// 默认的18洞数据（带标准杆）
const defaultHoles = [
  // 前九洞（默认都是4杆洞）
  { holeNumber: 1, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 2, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 3, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 4, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 5, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 6, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 7, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 8, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 9, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
  // 后九洞（混合杆数）
  { holeNumber: 10, par: 5, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 11, par: 5, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 12, par: 3, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 13, par: 5, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 14, par: 5, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 15, par: 3, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 16, par: 3, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 17, par: 3, score: '', putts: '', ob: 0, fairway: false, gir: false },
  { holeNumber: 18, par: 4, score: '', putts: '', ob: 0, fairway: false, gir: false },
];

const AddScore = () => {
  const navigate = useNavigate();
  const [inputMode, setInputMode] = useState('overall'); // 'overall' 或 'holes'
  const [loading, setLoading] = useState(false);
  const [activeHoleTab, setActiveHoleTab] = useState('frontNine'); // 'frontNine' 或 'backNine'
  
  // 基础信息
  const [formData, setFormData] = useState({
    courseName: '',
    date: new Date().toISOString().split('T')[0],
    tees: 'Blue',
    notes: '',
    weather: {
      condition: '',
      temp: '',
      wind: ''
    }
  });
  
  // 整场数据模式的字段
  const [overallData, setOverallData] = useState({
    frontNine: '',
    backNine: '',
    totalScore: '',
    totalPutts: '',
    threePutts: '0',
    totalGir: '',
    fairwaysHit: '',
    totalOb: '0',
    doubleBogeys: '0',
    bogeys: '0',
    pars: '0',
    birdies: '0'
  });
  
  // 18洞详情模式的数据
  const [holesData, setHolesData] = useState([...defaultHoles]);
  
  // 计算出的统计数据（从holesData计算）
  const [calculatedStats, setCalculatedStats] = useState(null);
  
  // 天气条件选项
  const weatherConditions = [
    '晴天', '多云', '阴天', '小雨', '大雨', '阵雨', '雷雨', '雾天', '雪天'
  ];

  // 当holesData变化时，实时计算统计数据
  useEffect(() => {
    if (inputMode === 'holes') {
      const stats = calculateStatsFromHoles(holesData);
      setCalculatedStats(stats);
      
      // 同时更新overallData用于显示
      setOverallData(prev => ({
        ...prev,
        frontNine: stats.frontNine,
        backNine: stats.backNine,
        totalScore: stats.totalScore,
        totalPutts: stats.totalPutts,
        threePutts: stats.threePutts,
        totalGir: stats.totalGir,
        fairwaysHit: stats.fairwaysHit,
        totalOb: stats.totalOb,
        doubleBogeys: stats.doubleBogeys,
        bogeys: stats.bogeys,
        pars: stats.pars,
        birdies: stats.birdies
      }));
    }
  }, [holesData, inputMode]);

  // 处理基础信息变化
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理天气变化
  const handleWeatherChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      weather: {
        ...prev.weather,
        [field]: value
      }
    }));
  };

  // 处理整场数据变化
  const handleOverallChange = (e) => {
    const { name, value } = e.target;
    setOverallData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理单洞数据变化
  const handleHoleChange = (index, field, value) => {
    const newHolesData = [...holesData];
    
    if (field === 'fairway' || field === 'gir') {
      // 处理复选框
      newHolesData[index][field] = !newHolesData[index][field];
    } else {
      // 处理数字输入
      newHolesData[index][field] = value === '' ? '' : Number(value);
    }
    
    setHolesData(newHolesData);
  };

  // 重置表单
  const handleReset = () => {
    setFormData({
      courseName: '',
      date: new Date().toISOString().split('T')[0],
      tees: 'Blue',
      notes: '',
      weather: {
        condition: '',
        temp: '',
        wind: ''
      }
    });
    
    setOverallData({
      frontNine: '',
      backNine: '',
      totalScore: '',
      totalPutts: '',
      threePutts: '0',
      totalGir: '',
      fairwaysHit: '',
      totalOb: '0',
      doubleBogeys: '0',
      bogeys: '0',
      pars: '0',
      birdies: '0'
    });
    
    setHolesData([...defaultHoles]);
    setCalculatedStats(null);
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 验证必填字段
    if (!formData.courseName.trim()) {
      alert('请填写球场名称');
      return;
    }
    
    if (!formData.date) {
      alert('请选择日期');
      return;
    }
    
    // 根据输入模式准备数据
    let finalData = {
      ...formData,
      // 整场数据模式的字段
      frontNine: Number(overallData.frontNine) || 0,
      backNine: Number(overallData.backNine) || 0,
      totalScore: Number(overallData.totalScore) || 0,
      totalPutts: Number(overallData.totalPutts) || 0,
      threePutts: Number(overallData.threePutts) || 0,
      totalGir: Number(overallData.totalGir) || 0,
      fairwaysHit: Number(overallData.fairwaysHit) || 0,
      totalOb: Number(overallData.totalOb) || 0,
      doubleBogeys: Number(overallData.doubleBogeys) || 0,
      bogeys: Number(overallData.bogeys) || 0,
      pars: Number(overallData.pars) || 0,
      birdies: Number(overallData.birdies) || 0,
      // 添加计算字段
      calculatedStats: {
        ...overallData,
        // 确保所有字段都是数字
        frontNine: Number(overallData.frontNine) || 0,
        backNine: Number(overallData.backNine) || 0,
        totalScore: Number(overallData.totalScore) || 0,
        totalPutts: Number(overallData.totalPutts) || 0,
        threePutts: Number(overallData.threePutts) || 0,
        totalGir: Number(overallData.totalGir) || 0,
        fairwaysHit: Number(overallData.fairwaysHit) || 0,
        totalOb: Number(overallData.totalOb) || 0,
        doubleBogeys: Number(overallData.doubleBogeys) || 0,
        bogeys: Number(overallData.bogeys) || 0,
        pars: Number(overallData.pars) || 0,
        birdies: Number(overallData.birdies) || 0
      }
    };
    
    // 如果使用18洞详情模式，保存每洞数据
    if (inputMode === 'holes') {
      finalData.holes = holesData.map(hole => ({
        ...hole,
        score: Number(hole.score) || 0,
        putts: Number(hole.putts) || 0,
        par: Number(hole.par) || 4,
        ob: Number(hole.ob) || 0,
        fairway: Boolean(hole.fairway),
        gir: Boolean(hole.gir)
      }));
    }
    
    // 清理weather对象（如果字段为空则删除）
    if (!formData.weather.condition && !formData.weather.temp && !formData.weather.wind) {
      delete finalData.weather;
    }
    
    try {
      setLoading(true);
      
      const res = await fetch('https://ai-golf-tracker.onrender.com/add-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData)
      });
      
      if (res.ok) {
        alert('成绩记录成功！');
        navigate('/stats');
      } else {
        const errorData = await res.json();
        alert(`提交失败：${errorData.error || '未知错误'}`);
      }
    } catch (err) {
      console.error('提交错误:', err);
      alert('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染单洞输入组件
  const renderHoleInput = (hole, index) => {
    return (
      <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-emerald-300 transition-colors">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm">第{hole.holeNumber}洞</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              Par {hole.par}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">杆数</label>
            <input
              type="number"
              min="1"
              max="20"
              value={hole.score}
              onChange={(e) => handleHoleChange(index, 'score', e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-center text-sm"
              placeholder="-"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">推杆</label>
            <input
              type="number"
              min="0"
              max="10"
              value={hole.putts}
              onChange={(e) => handleHoleChange(index, 'putts', e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-center text-sm"
              placeholder="-"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-1">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">OB</label>
            <input
              type="number"
              min="0"
              max="5"
              value={hole.ob}
              onChange={(e) => handleHoleChange(index, 'ob', e.target.value)}
              className="w-full border border-gray-300 rounded p-1 text-center text-xs"
            />
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-1">FIR</label>
            <button
              onClick={() => handleHoleChange(index, 'fairway', !hole.fairway)}
              className={`w-full text-xs py-1 rounded ${hole.fairway ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-500'}`}
            >
              {hole.fairway ? '✓' : '-'}
            </button>
          </div>
          <div className="flex flex-col items-center">
            <label className="text-xs text-gray-500 mb-1">GIR</label>
            <button
              onClick={() => handleHoleChange(index, 'gir', !hole.gir)}
              className={`w-full text-xs py-1 rounded ${hole.gir ? 'bg-blue-100 text-blue-700 border border-blue-300' : 'bg-gray-100 text-gray-500'}`}
            >
              {hole.gir ? '✓' : '-'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 pb-20">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">记录新成绩</h1>
              <p className="text-gray-500 text-sm mt-1">选择一种输入模式开始记录</p>
            </div>
            <button
              onClick={() => navigate('/stats')}
              className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm"
            >
              返回统计
            </button>
          </div>
        </div>

        {/* 模式选择 */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex gap-2">
            <button
              onClick={() => setInputMode('overall')}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition flex-1 ${inputMode === 'overall' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-1">📊</span>
                <span className="font-bold">整场数据模式</span>
                <span className="text-xs mt-1">直接输入汇总数据</span>
              </div>
            </button>
            <button
              onClick={() => setInputMode('holes')}
              className={`px-4 py-3 rounded-lg text-sm font-medium transition flex-1 ${inputMode === 'holes' ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg mb-1">⛳️</span>
                <span className="font-bold">18洞详情模式</span>
                <span className="text-xs mt-1">输入每洞数据，自动计算</span>
              </div>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基础信息 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">基本信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  球场名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="courseName"
                  value={formData.courseName}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="请输入球场名称"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Tee台</label>
                <select
                  name="tees"
                  value={formData.tees}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="Black">⚫️ Black (黑Tee)</option>
                  <option value="Gold">🟡 Gold (金Tee)</option>
                  <option value="Blue">🔵 Blue (蓝Tee)</option>
                  <option value="White">⚪️ White (白Tee)</option>
                  <option value="Red">🔴 Red (红Tee)</option>
                </select>
              </div>
            </div>

            {/* 天气信息 */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h4 className="text-sm font-medium text-gray-700 mb-3">天气信息（可选）</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">天气状况</label>
                  <select
                    value={formData.weather.condition}
                    onChange={(e) => handleWeatherChange('condition', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="">选择天气</option>
                    {weatherConditions.map(cond => (
                      <option key={cond} value={cond}>{cond}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">温度</label>
                  <input
                    type="text"
                    placeholder="如：23°C"
                    value={formData.weather.temp}
                    onChange={(e) => handleWeatherChange('temp', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">风速</label>
                  <input
                    type="text"
                    placeholder="如：12.2 km/h"
                    value={formData.weather.wind}
                    onChange={(e) => handleWeatherChange('wind', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 实时统计卡片 */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">实时统计</h3>
              {inputMode === 'holes' && calculatedStats && (
                <span className="text-xs text-emerald-600 bg-white/60 px-3 py-1 rounded-full">
                  根据每洞数据自动计算
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-2xl font-bold text-emerald-700">{overallData.totalScore || 0}</div>
                <div className="text-xs text-gray-500">总杆</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-blue-600">{overallData.totalPutts || 0}</div>
                <div className="text-xs text-gray-500">总推杆</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-red-500">{overallData.threePutts || 0}</div>
                <div className="text-xs text-gray-500">3推洞</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-cyan-600">{overallData.fairwaysHit || 0}</div>
                <div className="text-xs text-gray-500">FIR</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-purple-600">{overallData.totalGir || 0}</div>
                <div className="text-xs text-gray-500">GIR</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-red-600">{overallData.totalOb || 0}</div>
                <div className="text-xs text-gray-500">OB</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-xl font-bold text-orange-600">{overallData.doubleBogeys || 0}</div>
                <div className="text-xs text-gray-500">爆洞</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-orange-500">{overallData.bogeys || 0}</div>
                <div className="text-xs text-gray-500">鸡洞</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-green-600">{overallData.pars || 0}</div>
                <div className="text-xs text-gray-500">Par洞</div>
              </div>
              <div className="text-center bg-white/80 rounded-lg p-3 border border-gray-100">
                <div className="text-lg font-bold text-blue-600">{overallData.birdies || 0}</div>
                <div className="text-xs text-gray-500">鸟洞</div>
              </div>
            </div>
            
            {/* 前后九分数 */}
            <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
              <div className="text-center">
                <div className="text-sm text-gray-500">前九</div>
                <div className="text-lg font-bold text-gray-700">{overallData.frontNine || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">后九</div>
                <div className="text-lg font-bold text-gray-700">{overallData.backNine || 0}</div>
              </div>
            </div>
          </div>

          {/* 整场数据输入模式 */}
          {inputMode === 'overall' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">整场数据输入</h3>
              <p className="text-gray-500 text-sm mb-6">直接填写整场汇总数据（可覆盖自动计算的数据）</p>
              
              <div className="space-y-6">
                {/* 核心数据 */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h4 className="font-bold text-emerald-800 text-sm mb-3">核心成绩</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">前九</label>
                      <input
                        type="number"
                        name="frontNine"
                        value={overallData.frontNine}
                        onChange={handleOverallChange}
                        className="w-full border border-gray-300 rounded-lg p-3 text-center text-lg font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">后九</label>
                      <input
                        type="number"
                        name="backNine"
                        value={overallData.backNine}
                        onChange={handleOverallChange}
                        className="w-full border border-gray-300 rounded-lg p-3 text-center text-lg font-bold"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">总杆</label>
                      <input
                        type="number"
                        name="totalScore"
                        value={overallData.totalScore}
                        onChange={handleOverallChange}
                        className="w-full border border-emerald-300 rounded-lg p-3 text-center text-lg font-bold text-emerald-700 bg-white"
                        placeholder="0"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 详细数据 */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">推杆 (总)</label>
                    <input
                      type="number"
                      name="totalPutts"
                      value={overallData.totalPutts}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">三推洞</label>
                    <input
                      type="number"
                      name="threePutts"
                      value={overallData.threePutts}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-red-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-red-500 uppercase mb-1 block">OB / 罚杆</label>
                    <input
                      type="number"
                      name="totalOb"
                      value={overallData.totalOb}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-red-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">GIR (标On)</label>
                    <input
                      type="number"
                      name="totalGir"
                      value={overallData.totalGir}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">FIR (上球道)</label>
                    <input
                      type="number"
                      name="fairwaysHit"
                      value={overallData.fairwaysHit}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-orange-500 uppercase mb-1 block">爆洞</label>
                    <input
                      type="number"
                      name="doubleBogeys"
                      value={overallData.doubleBogeys}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-orange-500"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-orange-500 uppercase mb-1 block">鸡洞</label>
                    <input
                      type="number"
                      name="bogeys"
                      value={overallData.bogeys}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-orange-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-green-600 uppercase mb-1 block">Par洞</label>
                    <input
                      type="number"
                      name="pars"
                      value={overallData.pars}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-green-600"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">鸟洞</label>
                    <input
                      type="number"
                      name="birdies"
                      value={overallData.birdies}
                      onChange={handleOverallChange}
                      className="w-full border border-gray-300 rounded-lg p-3 text-center text-blue-600"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 18洞详情输入模式 */}
          {inputMode === 'holes' && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">18洞详情输入</h3>
              <p className="text-gray-500 text-sm mb-6">填写每洞数据，上方统计将实时计算</p>
              
              {/* 洞数切换标签 */}
              <div className="flex mb-6 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setActiveHoleTab('frontNine')}
                  className={`px-6 py-3 font-medium text-sm transition ${activeHoleTab === 'frontNine' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  前九洞 (1-9)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHoleTab('backNine')}
                  className={`px-6 py-3 font-medium text-sm transition ${activeHoleTab === 'backNine' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  后九洞 (10-18)
                </button>
              </div>
              
              {/* 前九洞 */}
              {activeHoleTab === 'frontNine' && (
                <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                  {holesData.slice(0, 9).map((hole, index) => renderHoleInput(hole, index))}
                </div>
              )}
              
              {/* 后九洞 */}
              {activeHoleTab === 'backNine' && (
                <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                  {holesData.slice(9, 18).map((hole, index) => renderHoleInput(hole, index + 9))}
                </div>
              )}
            </div>
          )}

          {/* 备注 */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">备注</h3>
            <VoiceTextarea 
              value={formData.notes} 
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))} 
              placeholder="记录一下心情、表现或特别事项..."
            />
          </div>

          {/* 操作按钮 */}
          <div className="sticky bottom-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-lg">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  重置表单
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/stats')}
                  className="px-5 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                >
                  取消
                </button>
              </div>
              
              <div className="flex gap-2">
                {inputMode === 'holes' && calculatedStats && (
                  <div className="mr-4 text-xs text-gray-500">
                    已计算: {calculatedStats.totalScore}杆, {calculatedStats.totalPutts}推
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition text-sm font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      保存中...
                    </>
                  ) : (
                    '保存成绩'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddScore;
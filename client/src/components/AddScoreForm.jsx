import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pinyin } from 'pinyin-pro';
import VoiceTextarea from './VoiceTextarea';

const API_URL = 'https://ai-golf-tracker.onrender.com/add-score';

// 初始化的18洞数据结构
const initialHoles = Array.from({ length: 18 }, (_, i) => ({
  number: i + 1,
  par: i < 9 ? 4 : 4,
  strokes: '',        // 杆数（已经是总杆，包含OB）
  putts: '',          // 推杆
  fairway: false,     // 上球道 (FIR)
  gir: false,         // 标On (GIR)
  ob: ''              // OB
}));

const AddScoreForm = ({ userEmail, onScoreAdded, onSuccess }) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 模式切换: 'simple' (整场) | 'detailed' (18洞详情)
  const [inputMode, setInputMode] = useState('simple'); 

  // 详细模式下的 18 洞数据
  const [holesData, setHolesData] = useState(initialHoles);

  const [formData, setFormData] = useState({
    courseName: '',
    date: new Date().toISOString().split('T')[0],
    tees: 'Blue',
    frontNine: '',
    backNine: '',
    totalScore: '',
    totalPutts: '',
    threePutts: '', // 3推
    fairwaysHit: '', // FIR (上球道)
    totalGir: '',    // GIR (标ON)
    totalOb: 0,
    // 新增五个字段
    doubleBogeys: 0,  // 爆洞
    pars: 0,          // Par洞
    birdies: 0,       // 鸟洞
    bogeys: 0,        // 鸡洞
    eagles: 0,        // 老鹰洞
    notes: ''
  });

  const [weather, setWeather] = useState({
    temp: '', condition: '', wind: '', location: ''
  });
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // --- 核心：详细模式自动计算逻辑 (实时更新 FIR、GIR 和五个新增字段) ---
  useEffect(() => {
    if (inputMode === 'detailed') {
      let f9 = 0, b9 = 0, tScore = 0, tPutts = 0, tOb = 0, tGir = 0, tFairway = 0, t3Putts = 0;
      // 新增五个字段的计数器
      let doubleBogeysCount = 0, parsCount = 0, birdiesCount = 0, bogeysCount = 0, eaglesCount = 0;
      
      holesData.forEach(h => {
        const s = parseInt(h.strokes) || 0;
        const p = parseInt(h.putts) || 0;
        const obVal = parseInt(h.ob) || 0;
        const par = h.par || 4;

        // 计算杆数（strokes已经是总杆数，包含OB）
        if (s > 0) {
          if (h.number <= 9) f9 += s;
          else b9 += s;
          tScore += s;
        }

        // 计算推杆 & 3推
        if (p > 0) {
          tPutts += p;
          if (p >= 3) t3Putts++; // 自动累计3推
        }

        // 累计 OB（累加罚杆数）
        tOb += obVal;

        // 累计 GIR (标ON)
        if (h.gir) tGir++;

        // 累计 FIR (上球道)
        if (h.fairway) tFairway++;

        // 计算新增五个字段（与标准杆比较）
        if (s > 0) {
          const diff = s - par;
          // 爆洞：大于等于2倍标准杆
          if (s >= 2 * par) {
            doubleBogeysCount++;
          } else if (diff === 1) {
            bogeysCount++; // 鸡洞：大于标准杆1杆
          } else if (diff === 0) {
            parsCount++; // Par洞：标准杆
          } else if (diff === -1) {
            birdiesCount++; // 鸟洞：小于标准杆1杆
          } else if (diff <= -2) {
            eaglesCount++; // 老鹰洞：小于等于标准杆2杆
          } else if (diff >= 2) {
            // 处理 diff >= 2 但不是2倍标准杆的情况
            // 可以根据需要归入其他分类，这里暂时不处理
          }
        }
      });

      // 实时回填到总数据
      setFormData(prev => ({
        ...prev,
        frontNine: f9 || '',
        backNine: b9 || '',
        totalScore: tScore || '',
        totalPutts: tPutts || '',
        threePutts: t3Putts || '',
        totalOb: tOb || '',
        totalGir: tGir || '',       // 实时更新标ON数
        fairwaysHit: tFairway || '', // 实时更新上球道数
        // 更新新增五个字段
        doubleBogeys: doubleBogeysCount || 0,
        bogeys: bogeysCount || 0,
        pars: parsCount || 0,
        birdies: birdiesCount || 0,
        eagles: eaglesCount || 0
      }));
    }
  }, [holesData, inputMode]);

  // --- 整场模式自动计算总分 ---
  useEffect(() => {
    if (inputMode === 'simple') {
      const f9 = parseInt(formData.frontNine) || 0;
      const b9 = parseInt(formData.backNine) || 0;
      if (f9 > 0 || b9 > 0) {
        setFormData(prev => ({ ...prev, totalScore: f9 + b9 }));
      }
    }
  }, [formData.frontNine, formData.backNine, inputMode]);

  // 天气查询
  useEffect(() => {
    if (formData.courseName && formData.courseName.length >= 2) {
      fetchWeather(formData.courseName, formData.date);
    }
  }, [formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHoleChange = (index, field, value) => {
    const newHoles = [...holesData];
    newHoles[index] = { ...newHoles[index], [field]: value };
    setHolesData(newHoles);
  };

  const fetchWeather = async (inputName, selectedDate) => {
    if (!inputName || typeof inputName !== 'string' || inputName.trim().length < 2) return;
    const dateToQuery = selectedDate || formData.date;
    const today = new Date().toISOString().split('T')[0];
    const isToday = dateToQuery === today;

    setWeatherError(null);
    setLoadingWeather(true);

    try {
      let rawCity = inputName;
      const cityMatch = inputName.match(/([\u4e00-\u9fa5]{2,})(?:市|县|区)/);
      if (cityMatch) rawCity = cityMatch[1];
      else {
        const chineseMatch = inputName.match(/[\u4e00-\u9fa5]{2,}/);
        if (chineseMatch) rawCity = chineseMatch[0].substring(0, 2);
      }

      let queryCity = rawCity;
      if (/[\u4e00-\u9fa5]/.test(rawCity)) {
        const pinyinResult = pinyin(rawCity, { toneType: 'none', separator: '' });
        queryCity = pinyinResult.replace(/\s+/g, '');
      }

      const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '933a528d7e1147ed97744718251712';
      const url = isToday 
        ? `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(queryCity)}&lang=zh`
        : `https://api.weatherapi.com/v1/history.json?key=${apiKey}&q=${encodeURIComponent(queryCity)}&dt=${dateToQuery}&lang=zh`;

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error?.message || '未找到该城市');

      let weatherData = {};
      if (isToday) {
        weatherData = {
          temp: `${data.current.temp_c}°C`,
          condition: data.current.condition.text,
          wind: `${data.current.wind_kph} km/h`,
          location: data.location.name
        };
      } else {
        const historyDay = data.forecast.forecastday[0].day;
        weatherData = {
          temp: `${historyDay.avgtemp_c}°C`,
          condition: historyDay.condition.text,
          wind: `${historyDay.maxwind_kph} km/h`,
          location: data.location.name
        };
      }
      setWeather(weatherData);
    } catch (err) {
      console.warn("天气获取失败:", err.message);
      if (err.message.includes('history')) setWeatherError("API不支持历史查询");
      else setWeatherError("未找到天气");
      setWeather({ temp: '', condition: '', wind: '', location: '' });
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    let finalEmail = storedUser?.email || userEmail;

    if (!finalEmail) {
      alert("错误：未检测到登录用户，请重新登录！");
      navigate('/login');
      setIsSubmitting(false);
      return;
    }

    // ✅ 修复点：在提交前实时计算统计值，确保使用最新数据
    const calculateFinalStats = () => {
      if (inputMode === 'detailed' && holesData.length > 0) {
        let doubleBogeys = 0, bogeys = 0, pars = 0, birdies = 0, eagles = 0;
        
        holesData.forEach(h => {
          const s = parseInt(h.strokes) || 0;
          const par = h.par || 4;
          
          if (s > 0) {
            const diff = s - par;
            // 爆洞：大于等于2倍标准杆
            if (s >= 2 * par) {
              doubleBogeys++;
            } else if (diff === 1) {
              bogeys++;
            } else if (diff === 0) {
              pars++;
            } else if (diff === -1) {
              birdies++;
            } else if (diff <= -2) {
              eagles++;
            }
          }
        });
        
        return { doubleBogeys, bogeys, pars, birdies, eagles };
      }
      
      // 整场模式使用formData中的值
      return {
        doubleBogeys: Number(formData.doubleBogeys) || 0,
        bogeys: Number(formData.bogeys) || 0,
        pars: Number(formData.pars) || 0,
        birdies: Number(formData.birdies) || 0,
        eagles: Number(formData.eagles) || 0
      };
    };

    const finalStats = calculateFinalStats();
    console.log('提交前的统计值:', finalStats); // 调试用

    // ✅ 数据清洗，防止空值报错
    const payload = {
      email: finalEmail.trim().toLowerCase(),
      ...formData,
      frontNine: Number(formData.frontNine) || 0,
      backNine: Number(formData.backNine) || 0,
      totalScore: Number(formData.totalScore) || 0,
      totalPutts: Number(formData.totalPutts) || 0,
      threePutts: Number(formData.threePutts) || 0,
      totalOb: Number(formData.totalOb) || 0,
      totalGir: Number(formData.totalGir) || 0,
      fairwaysHit: Number(formData.fairwaysHit) || 0,
      
      // ✅ 确保这四个字段都被正确转换为数字并发送
      doubleBogeys: Number(finalStats.doubleBogeys) || 0,  // 爆洞
      pars: Number(finalStats.pars) || 0,                  // Par洞
      birdies: Number(finalStats.birdies) || 0,            // 鸟洞
      bogeys: Number(finalStats.bogeys) || 0,              // 鸡洞
      eagles: Number(finalStats.eagles) || 0,              // 老鹰洞
      
      weather: (weather && weather.condition) ? weather : null,
      holes: inputMode === 'detailed' ? holesData.map(h => ({
        ...h,
        strokes: Number(h.strokes) || 0,
        putts: Number(h.putts) || 0,
        ob: Number(h.ob) || 0
      })) : []
    };

    console.log('最终提交的数据:', payload); // 调试用

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const responseData = await response.json();

      if (response.ok) {
        alert(`✅ 成绩保存成功！`);
        if (onScoreAdded) onScoreAdded(responseData);
        
        setFormData(prev => ({
            ...prev, 
            courseName: '', 
            totalScore: '', 
            frontNine: '', 
            backNine: '',
            totalPutts: '', 
            totalOb: 0, 
            totalGir: '', 
            threePutts: '', 
            fairwaysHit: '', 
            doubleBogeys: 0, 
            pars: 0, 
            birdies: 0, 
            bogeys: 0, 
            eagles: 0,
            notes: ''
        }));
        setHolesData(initialHoles);
        setIsExpanded(false);

        if (onSuccess) onSuccess();
        else navigate('/');
      } else {
        alert('❌ 保存失败: ' + (responseData.message || responseData.error || '未知错误'));
      }
    } catch (error) {
      alert('❌ 网络错误: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full h-11 px-4 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm";
  const labelClass = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide truncate"; 

  const renderHoleInputs = (start, end) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-center border-collapse">
        <thead>
          <tr className="bg-emerald-50">
            <th className="p-2 border border-emerald-100 rounded-tl-lg min-w-[40px]">Hole</th>
            {Array.from({ length: 9 }).map((_, i) => (
              <th key={i} className="p-2 border border-emerald-100 min-w-[35px]">{start + i}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Par */}
          <tr>
            <td className="p-2 font-bold bg-gray-50 border">Par</td>
            {holesData.slice(start - 1, end).map((h, i) => (
              <td key={i} className="p-0 border">
                <input 
                  type="number" 
                  value={h.par}
                  onChange={(e) => handleHoleChange(start - 1 + i, 'par', parseInt(e.target.value))}
                  className="w-full h-8 text-center bg-transparent outline-none focus:bg-yellow-50"
                />
              </td>
            ))}
          </tr>
          {/* 推杆 */}
          <tr>
            <td className="p-2 font-bold bg-gray-50 border text-gray-500">推</td>
            {holesData.slice(start - 1, end).map((h, i) => (
              <td key={i} className="p-0 border">
                <input 
                  type="number" 
                  value={h.putts}
                  placeholder=""
                  onChange={(e) => handleHoleChange(start - 1 + i, 'putts', e.target.value)}
                  className="w-full h-8 text-center text-gray-600 outline-none focus:bg-blue-50"
                />
              </td>
            ))}
          </tr>
          {/* OB */}
          <tr>
            <td className="p-2 font-bold bg-white border text-red-500">OB</td>
            {holesData.slice(start - 1, end).map((h, i) => (
              <td key={i} className="p-0 border">
                <input 
                  type="number" 
                  value={h.ob}
                  placeholder=""
                  onChange={(e) => handleHoleChange(start - 1 + i, 'ob', e.target.value)}
                  className="w-full h-8 text-center text-red-500 font-medium outline-none focus:bg-red-50"
                />
              </td>
            ))}
          </tr>
          {/* 总杆（原名"杆"）- 调整到推杆和OB下面 */}
          <tr>
            <td className="p-2 font-bold bg-white border text-emerald-700">总杆</td>
            {holesData.slice(start - 1, end).map((h, i) => (
              <td key={i} className="p-0 border">
                <input 
                  type="number" 
                  value={h.strokes}
                  placeholder="-"
                  onChange={(e) => handleHoleChange(start - 1 + i, 'strokes', e.target.value)}
                  className="w-full h-10 text-center font-bold text-lg outline-none focus:bg-emerald-50"
                />
              </td>
            ))}
          </tr>
          {/* GIR & FIR Checkboxes */}
          <tr>
            <td className="p-1 font-bold bg-gray-50 border text-[10px]">G/F</td>
            {holesData.slice(start - 1, end).map((h, i) => (
              <td key={i} className="p-1 border h-8 align-middle">
                <div className="flex flex-col items-center gap-1">
                   {/* GIR (标ON) */}
                   <input 
                      type="checkbox" 
                      checked={h.gir} 
                      onChange={(e) => handleHoleChange(start - 1 + i, 'gir', e.target.checked)} 
                      title="GIR (标ON)" 
                      className="accent-emerald-500 w-3 h-3 cursor-pointer" 
                   />
                   {/* Fairway (上球道) */}
                   <input 
                      type="checkbox" 
                      checked={h.fairway} 
                      onChange={(e) => handleHoleChange(start - 1 + i, 'fairway', e.target.checked)} 
                      title="FIR (上球道)" 
                      className="accent-blue-500 w-3 h-3 cursor-pointer" 
                   />
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 mb-8">
      
      <div onClick={() => setIsExpanded(!isExpanded)} className="p-5 flex justify-between items-center cursor-pointer hover:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xl">📝</div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">记分卡</h2>
            <p className="text-xs text-emerald-600">账户: {JSON.parse(localStorage.getItem('user'))?.email || userEmail}</p>
          </div>
        </div>
        <span className={`text-2xl text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </div>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-5 pt-0 animate-fadeIn space-y-5">
          
          <div className="flex justify-center mb-2">
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm font-medium">
              <button 
                type="button"
                onClick={() => setInputMode('simple')}
                className={`px-4 py-1.5 rounded-md transition-all ${inputMode === 'simple' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}
              >
                ⚡️ 整场模式
              </button>
              <button 
                type="button"
                onClick={() => setInputMode('detailed')}
                className={`px-4 py-1.5 rounded-md transition-all ${inputMode === 'detailed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'}`}
              >
                📊 18洞详情模式
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>球场名称</label>
                <input type="text" name="courseName" placeholder="例如：观澜湖" value={formData.courseName} onChange={handleChange} onBlur={(e) => fetchWeather(e.target.value)} className={inputClass} required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className={labelClass}>日期</label>
                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={inputClass} required />
                 </div>
                 <div>
                    <label className={labelClass}>Tee台</label>
                    <select name="tees" value={formData.tees} onChange={handleChange} className={inputClass}>
                      <option value="Black">⚫️ 黑</option>
                      <option value="Gold">🟡 金</option>
                      <option value="Blue">🔵 蓝</option>
                      <option value="White">⚪️ 白</option>
                      <option value="Red">🔴 红</option>
                    </select>
                 </div>
              </div>
          </div>

          {(loadingWeather || weather.condition || weatherError) && (
              <div className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${weatherError ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-800'}`}>
                 {loadingWeather ? '获取天气中...' : weatherError ? weatherError : `${weather.condition} ${weather.temp} (${weather.wind})`}
              </div>
          )}

          {inputMode === 'detailed' ? (
            <div className="space-y-4">
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 mb-2 block px-1">前九 (Front 9)</span>
                    {renderHoleInputs(1, 9)}
                </div>
                <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <span className="text-xs font-bold text-gray-500 mb-2 block px-1">后九 (Back 9)</span>
                    {renderHoleInputs(10, 18)}
                </div>
            </div>
          ) : (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 grid grid-cols-3 gap-4">
                <div className="col-span-1">
                    <label className={labelClass + " text-center"}>前九</label>
                    <input type="number" name="frontNine" value={formData.frontNine} onChange={handleChange} className={`${inputClass} text-center`} />
                </div>
                <div className="col-span-1">
                    <label className={labelClass + " text-center"}>后九</label>
                    <input type="number" name="backNine" value={formData.backNine} onChange={handleChange} className={`${inputClass} text-center`} />
                </div>
                <div className="col-span-1">
                    <label className="block text-xs font-bold text-emerald-700 mb-1.5 text-center uppercase">总杆</label>
                    <input type="number" name="totalScore" value={formData.totalScore} readOnly className={`${inputClass} text-center font-extrabold text-xl text-emerald-700 bg-white`} />
                </div>
            </div>
          )}

          {/* 公共统计数据区：第一行 6列布局 */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
             {/* 1. 总杆 (新增) */}
             <div className="col-span-1">
                <label className={labelClass} title="总杆数">总杆</label>
                <input 
                  type="number" 
                  name="totalScore" 
                  value={formData.totalScore} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} font-bold text-emerald-700 ${inputMode === 'detailed' ? 'bg-gray-100' : 'bg-white'} px-2`} 
                />
             </div>

             {/* 2. 总推 */}
             <div className="col-span-1">
                <label className={labelClass} title="总推杆数">总推</label>
                <input type="number" name="totalPutts" value={formData.totalPutts} onChange={handleChange} readOnly={inputMode === 'detailed'} className={`${inputClass} ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} />
             </div>
             
             {/* 3. 3推 */}
             <div className="col-span-1">
                <label className={labelClass} title="3推洞数">3推</label>
                <input type="number" name="threePutts" value={formData.threePutts} onChange={handleChange} readOnly={inputMode === 'detailed'} className={`${inputClass} ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} />
             </div>

             {/* 4. FIR */}
             <div className="col-span-1">
                <label className={labelClass} title="上球道数">FIR (上球道)</label>
                <input type="number" name="fairwaysHit" value={formData.fairwaysHit} onChange={handleChange} readOnly={inputMode === 'detailed'} className={`${inputClass} ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} />
             </div>
             
             {/* 5. GIR */}
             <div className="col-span-1">
                <label className={labelClass} title="标ON数">GIR (标ON)</label>
                <input type="number" name="totalGir" value={formData.totalGir} onChange={handleChange} readOnly={inputMode === 'detailed'} className={`${inputClass} ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} />
             </div>
             
             {/* 6. OB */}
             <div className="col-span-1">
                <label className={labelClass}>OB</label>
                <input type="number" name="totalOb" value={formData.totalOb} onChange={handleChange} readOnly={inputMode === 'detailed'} className={`${inputClass} text-red-500 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} />
             </div>
          </div>

          {/* 新增的五个字段：爆洞、鸡洞、Par洞、鸟洞、老鹰洞 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
             {/* 1. 爆洞 (doubleBogeys) */}
             <div className="col-span-1">
                <label className={labelClass} title="大于等于2倍标准杆">爆洞</label>
                <input 
                  type="number" 
                  name="doubleBogeys" 
                  value={formData.doubleBogeys} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} text-orange-600 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} 
                />
             </div>

             {/* 2. 鸡洞 (bogeys) */}
             <div className="col-span-1">
                <label className={labelClass} title="大于标准杆1杆">鸡洞</label>
                <input 
                  type="number" 
                  name="bogeys" 
                  value={formData.bogeys} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} text-orange-500 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} 
                />
             </div>

             {/* 3. Par洞 (pars) */}
             <div className="col-span-1">
                <label className={labelClass} title="标准杆">Par洞</label>
                <input 
                  type="number" 
                  name="pars" 
                  value={formData.pars} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} text-green-600 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} 
                />
             </div>

             {/* 4. 鸟洞 (birdies) */}
             <div className="col-span-1">
                <label className={labelClass} title="小于标准杆1杆">鸟洞</label>
                <input 
                  type="number" 
                  name="birdies" 
                  value={formData.birdies} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} text-blue-600 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} 
                />
             </div>

             {/* 5. 老鹰洞 (eagles) */}
             <div className="col-span-1">
                <label className={labelClass} title="小于等于标准杆2杆">老鹰洞</label>
                <input 
                  type="number" 
                  name="eagles" 
                  value={formData.eagles} 
                  onChange={handleChange} 
                  readOnly={inputMode === 'detailed'} 
                  className={`${inputClass} text-purple-600 ${inputMode === 'detailed' ? 'bg-gray-100' : ''} px-2`} 
                />
             </div>
          </div>

          <div>
              <label className={labelClass}>备注</label>
              <VoiceTextarea value={formData.notes} onChange={handleChange} placeholder="记录一下心情..." />
          </div>

          <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-emerald-700 active:scale-[0.99] transition-all">
            {isSubmitting ? '保存中...' : '💾 保存成绩'}
          </button>
        </form>
      )}
    </div>
  );
};

export default AddScoreForm;
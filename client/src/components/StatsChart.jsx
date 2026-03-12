import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import VoiceTextarea from './VoiceTextarea';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, ComposedChart
} from 'recharts';

const StatsChart = ({ scores, onUpdate, onDelete }) => {
  // ==========================================
  // 1. 状态管理 (State)
  // ==========================================
  const [editingScore, setEditingScore] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState(null);
  
  // AI 教练相关状态
  const [chatHistory, setChatHistory] = useState([]);
  const [inputMsg, setInputMsg] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeCount, setAnalyzeCount] = useState(5); 
  const chatEndRef = useRef(null);

  // 自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, analyzing]);

  // ==========================================
  // 2. 数据处理与图表配置
  // ==========================================
  if (!scores || scores.length === 0) {
    return (
      <div className="bg-white p-10 rounded-2xl shadow-sm text-center border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-6xl mb-4 opacity-80">⛳️</div>
        <p className="text-gray-800 font-bold text-lg">暂无数据</p>
        <p className="text-gray-400 text-sm mt-2">快去记录您的第一场球吧！</p>
      </div>
    );
  }

  // 按日期排序用于图表 (旧 -> 新)
  const chartData = [...scores].sort((a, b) => new Date(a.date) - new Date(b.date)).map(item => ({
    ...item,
    totalScore: Number(item.totalScore) || 0,
    totalPutts: Number(item.totalPutts) || 0,
    totalGir: Number(item.totalGir) || 0,
    fairwaysHit: Number(item.fairwaysHit) || 0,
    threePutts: Number(item.threePutts) || 0,
    totalOb: Number(item.totalOb) || 0,
    doubleBogeys: Number(item.doubleBogeys) || 0,
    pars: Number(item.pars) || 0,
    birdies: Number(item.birdies) || 0,
    bogeys: Number(item.bogeys) || 0,
    dateShort: item.date ? item.date.substring(5) : '',
    courseName: item.courseName || '未知球场'
  }));

  // 按日期排序用于列表和AI分析 (新 -> 旧)
  const sortedScoresDesc = [...scores].sort((a, b) => {
    // 先按日期降序
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    // 日期相同，按创建时间降序（后录入的在上）
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  // 天气图标映射
  const getWeatherIcon = (condition) => {
    if (!condition) return '🌤️';
    const lowerCond = condition.toLowerCase();
    if (lowerCond.includes('晴')) return '☀️';
    if (lowerCond.includes('云')) return '⛅';
    if (lowerCond.includes('雨')) return '🌧️';
    if (lowerCond.includes('阴')) return '☁️';
    if (lowerCond.includes('雪')) return '❄️';
    if (lowerCond.includes('雾')) return '🌫️';
    if (lowerCond.includes('雷')) return '⛈️';
    return '🌤️';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-gray-100 shadow-xl rounded-lg text-sm z-50 max-w-xs">
          <p className="font-bold mb-1 text-gray-800">{label}</p>
          <p className="text-xs text-gray-500 mb-2">{data.courseName}</p>
          {data.weather && (
            <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-100">
              <div className="flex items-center gap-1 text-blue-600 text-xs">
                <span>{getWeatherIcon(data.weather.condition)}</span>
                <span className="font-medium">{data.weather.temp}</span>
                <span className="text-gray-500">•</span>
                <span>{data.weather.condition}</span>
              </div>
            </div>
          )}
          <div className="border-t border-gray-100 pt-2 space-y-1">
            {payload.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke || entry.fill || entry.color }}></span>
                <span className="font-medium text-gray-700">{entry.name}: {entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // ==========================================
  // 3. AI 交互逻辑
  // ==========================================
  
  const FORMAT_INSTRUCTION = `
  【回答格式要求】：
  1. 请务必使用 Markdown 格式来组织内容，让重点一目了然。
  2. 关键数据或建议请使用 **加粗**。
  3. 小标题请使用 ### (不要用一级标题 #)。
  4. 列表请使用 - 或 1. 。
  5. 语气要自然，像真人教练一样说话。
  `;

  const sendAIRequest = async (newHistory, systemContext) => {
    try {
      const fullMessages = [
        { role: 'system', content: "You are a helpful golf coach assistant." }, 
        { role: 'system', content: systemContext + FORMAT_INSTRUCTION }, 
        ...newHistory 
      ];

      const res = await fetch('https://ai-golf-tracker.onrender.com/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: fullMessages })
      });
      
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      alert("AI 连接失败，请稍后再试");
      if (newHistory.length === 1) setChatHistory([]);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMsg.trim()) return;
    
    const userMessage = { role: 'user', content: inputMsg };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setInputMsg("");
    setAnalyzing(true);

    const recentData = sortedScoresDesc.slice(0, analyzeCount);
    const systemContext = `这是用户最近 ${analyzeCount} 场的成绩数据: ${JSON.stringify(recentData)}。请作为高尔夫教练进行回答。`;

    await sendAIRequest(newHistory, systemContext);
  };

  const handleAnalyze = async (type = 'general') => {
    setAnalyzing(true);
    let initialPrompt = "";
    
    if (type === 'putting') {
      initialPrompt = `请只针对我最近 ${analyzeCount} 场的【推杆数据 (Putts)】进行深度分析。计算平均推杆数，指出趋势，并给出练习建议。使用Markdown格式。`;
    } else {
      initialPrompt = `请帮我分析最近 ${analyzeCount} 场的整体表现，列出强项、弱项和建议。使用Markdown格式。`;
    }

    const userMessage = { role: 'user', content: initialPrompt };
    setChatHistory([userMessage]); 

    const recentData = sortedScoresDesc.slice(0, analyzeCount);
    const systemContext = `这是用户最近 ${analyzeCount} 场的成绩数据: ${JSON.stringify(recentData)}。`;

    await sendAIRequest([userMessage], systemContext);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ==========================================
  // 4. 编辑功能逻辑
  // ==========================================
  const openEditModal = (score) => {
    setEditingScore({ ...score });
    setIsEditModalOpen(true);
    setActiveDropdownId(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingScore(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingScore) return;

    const payload = {
       ...editingScore,
       frontNine: Number(editingScore.frontNine),
       backNine: Number(editingScore.backNine),
       totalScore: Number(editingScore.totalScore),
       totalPutts: Number(editingScore.totalPutts),
       totalGir: Number(editingScore.totalGir),
       totalOb: Number(editingScore.totalOb),
       fairwaysHit: Number(editingScore.fairwaysHit),
       threePutts: Number(editingScore.threePutts),
       doubleBogeys: Number(editingScore.doubleBogeys || 0),
       pars: Number(editingScore.pars || 0),
       birdies: Number(editingScore.birdies || 0),
       bogeys: Number(editingScore.bogeys || 0)
    };

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/update-score/${editingScore._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("更新成功！");
        setIsEditModalOpen(false);
        if (onUpdate) onUpdate(); 
      } else {
        const errorData = await res.json();
        alert("更新失败: " + errorData.error);
      }
    } catch (err) {
      alert("网络错误，更新失败");
    }
  };

  // ==========================================
  // 5. 渲染 UI
  // ==========================================
  return (
    <div className="space-y-6 pb-20">

      {/* --- 图表展示区 --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 总杆数/总推杆数 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pl-2 border-l-4 border-emerald-500">
            <span className="font-bold text-gray-700">🏆 总杆数 & 总推杆数</span>
            <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">越低越好</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="dateShort" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} width={25} />
                <YAxis yAxisId="right" orientation="right" domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Line yAxisId="left" type="monotone" dataKey="totalScore" name="总杆数" stroke="#10b981" strokeWidth={3} dot={{r:3, fill:'#10b981'}} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="totalPutts" name="总推杆" stroke="#3b82f6" strokeWidth={2} dot={{r:3, fill:'#3b82f6'}} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. 鸡洞/Par洞/鸟洞 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pl-2 border-l-4 border-purple-500">
             <span className="font-bold text-gray-700">🐔 Par/Birdie/Bogey</span>
             <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">追求小鸟和Par</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="dateShort" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '10px'}} iconSize={8} />
                <Bar name="鸡洞" dataKey="bogeys" fill="#f97316" radius={[2, 2, 0, 0]} />
                <Bar name="Par洞" dataKey="pars" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar name="鸟洞" dataKey="birdies" fill="#3b82f6" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. FIR/GIR */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4 pl-2 border-l-4 border-cyan-500">
             <span className="font-bold text-gray-700">🎯 FIR & GIR</span>
             <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">越高越好</span>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="dateShort" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '10px'}} iconSize={8} /> 
                <Line name="FIR" type="monotone" dataKey="fairwaysHit" stroke="#06b6d4" strokeWidth={2} dot={{r:2}} activeDot={{ r: 5 }} />
                <Line name="GIR" type="monotone" dataKey="totalGir" stroke="#8b5cf6" strokeWidth={2} dot={{r:2}} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. OB数/爆洞/3推洞 */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
           <div className="flex justify-between items-center mb-4 pl-2 border-l-4 border-red-500">
             <span className="font-bold text-gray-700">⚠️ OB / 爆洞 / 3推</span>
             <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full">控制失误</span>
           </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDouble" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorThreePutts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="dateShort" tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 10, fill: '#9ca3af'}} axisLine={false} tickLine={false} width={25} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: '10px'}} iconSize={8} />
                <Area name="OB" type="monotone" dataKey="totalOb" stroke="#ef4444" fillOpacity={1} fill="url(#colorOb)" strokeWidth={2} />
                <Area name="爆洞" type="monotone" dataKey="doubleBogeys" stroke="#f97316" fillOpacity={1} fill="url(#colorDouble)" strokeWidth={2} />
                <Area name="3推洞" type="monotone" dataKey="threePutts" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorThreePutts)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- AI 教练区 --- */}
      <div className="bg-white border border-emerald-100 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px]">
        
        {/* 头部控制栏 */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 border-b border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div>
              <h2 className="font-bold text-emerald-900 text-sm">AI 教练分析</h2>
              <p className="text-[10px] text-emerald-600">DeepSeek 驱动 · 基于 {analyzeCount} 场数据</p>
            </div>
          </div>
          
          {chatHistory.length === 0 && (
            <div className="flex items-center gap-2 bg-white/60 p-1 rounded-lg border border-emerald-100">
              <input 
                type="tel" 
                pattern="[0-9]*" 
                value={analyzeCount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') setAnalyzeCount(''); 
                  else {
                    const num = parseInt(val);
                    if (!isNaN(num) && num > 0) setAnalyzeCount(num);
                  }
                }}
                onBlur={() => { if (analyzeCount === '' || analyzeCount < 1) setAnalyzeCount(5); }}
                className="w-8 text-center text-xs font-bold text-emerald-800 bg-transparent border-none focus:ring-0 p-0"
              />
              <span className="text-[10px] text-gray-400 mr-1">场</span>
              <button onClick={() => handleAnalyze('general')} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded shadow-sm hover:bg-emerald-700 transition">综合诊断</button>
              <button onClick={() => handleAnalyze('putting')} className="px-3 py-1 bg-white text-emerald-600 border border-emerald-200 text-xs rounded hover:bg-emerald-50 transition">专项推杆</button>
            </div>
          )}
        </div>
        
        {/* 对话内容区 (使用 ReactMarkdown) */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 space-y-4">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-xs">点击上方按钮，开始复盘</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' ? 'bg-emerald-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                  }`}>
                  {msg.role === 'assistant' && <span className="block font-bold mb-1 text-[10px] text-emerald-600 uppercase">Coach</span>}
                  
                  {/* Markdown 渲染组件 */}
                  <div className="prose prose-sm prose-emerald max-w-none">
                    <ReactMarkdown
                        components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold text-emerald-700" {...props} />,
                            h3: ({node, ...props}) => <h3 className="font-bold text-md mt-3 mb-1 text-gray-900" {...props} />,
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                  </div>

                </div>
              </div>
            ))
          )}
          {analyzing && <div className="text-xs text-gray-400 ml-2 animate-pulse">教练思考中...</div>}
          <div ref={chatEndRef} />
        </div>

        {/* 底部输入框 */}
        {chatHistory.length > 0 && (
          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="继续追问..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              disabled={analyzing}
            />
            <button onClick={handleSendMessage} disabled={analyzing || !inputMsg.trim()} className="bg-emerald-600 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md disabled:bg-gray-300">
              ↑
            </button>
          </div>
        )}
      </div>

      {/* --- 历史记录列表 --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-md font-bold text-gray-800">历史记录</h3>
            <p className="text-xs text-gray-400 mt-1">点击右侧菜单可编辑或删除记录</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border shadow-sm">
              共 <span className="font-bold text-emerald-600">{sortedScoresDesc.length}</span> 场
            </span>
          </div>
        </div>

        {/* 1. 电脑端显示表格 - 优化版 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  日期 / 球场
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  总杆成绩
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  推杆表现
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  击球精度
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  失误控制
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-36">
                  成绩分布
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {sortedScoresDesc.map((score) => (
                <React.Fragment key={score._id}>
                  <tr className="hover:bg-emerald-50/30 transition-colors duration-150 group">
                    {/* 日期/球场列 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-start gap-3">
                        {/* 日期卡片 */}
                        <div className="text-center min-w-[3.5rem]">
                          <div className="text-xs text-gray-500 uppercase mb-1">
                            {new Date(score.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="text-lg font-bold text-gray-800">
                              {new Date(score.date).getDate()}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {new Date(score.date).toLocaleDateString('zh-CN', { month: 'short' })}
                            </div>
                          </div>
                        </div>
                        
                        {/* 球场信息 */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{score.courseName}</div>
                          <div className="text-xs text-gray-500 mt-1">{score.tees} Tees</div>
                          
                          {/* 天气信息 */}
                          {score.weather && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-sm">{getWeatherIcon(score.weather.condition)}</span>
                                <span className="font-medium text-gray-700">{score.weather.temp}</span>
                                <span className="text-gray-300">•</span>
                                <span className="text-gray-600 truncate">{score.weather.condition}</span>
                              </div>
                              {score.weather.wind && (
                                <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                  <span>🌬️</span>
                                  <span>{score.weather.wind}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* ✅ 修改点1：总杆成绩列 - 移除"加油"标签 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center">
                        <div className="relative">
                          <div className="text-2xl font-bold text-emerald-700 mb-1">{score.totalScore}</div>
                          {/* ✅ 移除"优秀/良好/加油"标签 */}
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full mt-1">
                          前{score.frontNine}/{score.backNine}后
                        </div>
                      </div>
                    </td>

                    {/* 推杆表现列 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="space-y-2">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">总推杆</div>
                          <div className={`text-lg font-bold ${score.totalPutts <= 30 ? 'text-blue-600' : 'text-gray-700'}`}>
                            {score.totalPutts}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">3推洞</div>
                          <div className={`text-lg font-bold ${score.threePutts > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            {score.threePutts || 0}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 击球精度列 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">FIR</div>
                          <div className="text-lg font-bold text-cyan-600">{score.fairwaysHit || '-'}</div>
                          <div className="text-[10px] text-gray-400">上球道</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">GIR</div>
                          <div className="text-lg font-bold text-purple-600">{score.totalGir}</div>
                          <div className="text-[10px] text-gray-400">标On</div>
                        </div>
                      </div>
                    </td>

                    {/* 失误控制列 */}
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">OB</div>
                          <div className={`text-lg font-bold ${score.totalOb > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            {score.totalOb || 0}
                          </div>
                          <div className="text-[10px] text-gray-400">罚杆</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">爆洞</div>
                          <div className={`text-lg font-bold ${score.doubleBogeys > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                            {score.doubleBogeys || 0}
                          </div>
                          <div className="text-[10px] text-gray-400">大于2Par</div>
                        </div>
                      </div>
                    </td>

                    {/* 成绩分布列 */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="space-y-3">
                        {/* 进度条样式 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-blue-600 font-medium">鸟洞</span>
                            <span className="font-bold">{score.birdies || 0}</span>
                          </div>
                          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${((score.birdies || 0) / 18 * 100).toFixed(0)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600 font-medium">Par洞</span>
                            <span className="font-bold">{score.pars || 0}</span>
                          </div>
                          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full transition-all duration-500"
                              style={{ width: `${((score.pars || 0) / 18 * 100).toFixed(0)}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-orange-500 font-medium">鸡洞</span>
                            <span className="font-bold">{score.bogeys || 0}</span>
                          </div>
                          <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-400 rounded-full transition-all duration-500"
                              style={{ width: `${((score.bogeys || 0) / 18 * 100).toFixed(0)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 操作列 */}
                    <td className="px-4 py-4 whitespace-nowrap text-right relative">
                      <button 
                        onClick={() => setActiveDropdownId(activeDropdownId === score._id ? null : score._id)}
                        className="text-gray-400 hover:text-emerald-600 font-bold px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        ⋮
                      </button>
                      {activeDropdownId === score._id && (
                        <div className="absolute right-8 top-0 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-1 text-left">
                          <button 
                            onClick={() => openEditModal(score)} 
                            className="block w-full text-left px-4 py-2 hover:bg-emerald-50 text-gray-700 text-xs flex items-center gap-2"
                          >
                            <span>✏️</span>
                            <span>编辑</span>
                          </button>
                          <button 
                            onClick={() => onDelete(score._id)} 
                            className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-xs flex items-center gap-2"
                          >
                            <span>🗑️</span>
                            <span>删除</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* 备注行 */}
                  {score.notes && (
                    <tr className="bg-gray-50/50">
                      <td colSpan="7" className="px-4 py-3">
                        <div className="flex items-start gap-2 text-sm text-gray-600 bg-white/80 rounded-lg p-3 border border-gray-100">
                          <div className="text-gray-400 mt-0.5">📝</div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 font-medium mb-1">备注</div>
                            <div className="text-gray-700">{score.notes}</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. 手机端显示卡片 - 保持原有样式，手机端本来就没有"加油"标签 */}
        <div className="md:hidden p-4 space-y-4 bg-gray-50/50">
            {sortedScoresDesc.map((score) => (
                <div key={score._id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full opacity-50 pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <div>
                            <h4 className="font-bold text-gray-800 text-lg">{score.courseName}</h4>
                            <div className="mb-1">
                              <p className="text-xs text-gray-400">{new Date(score.date).toLocaleDateString()} · {score.tees} Tees</p>
                              {score.weather && (
                                <div className="mt-1">
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-sm">{getWeatherIcon(score.weather.condition)}</span>
                                    <span className="font-medium text-blue-600">{score.weather.temp}</span>
                                    <span className="text-gray-300 mx-1">•</span>
                                    <span className="text-gray-600">{score.weather.condition}</span>
                                  </div>
                                  {score.weather.wind && (
                                    <div className="text-xs text-gray-400 mt-0.5">
                                      <span className="mr-0.5">🌬️</span>{score.weather.wind}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                        </div>
                        <div className="relative">
                            <button onClick={() => setActiveDropdownId(activeDropdownId === score._id ? null : score._id)} className="p-2 -mr-2 text-gray-300 hover:text-emerald-600 font-bold text-xl">⋮</button>
                            {activeDropdownId === score._id && (
                                <div className="absolute right-0 top-8 w-28 bg-white rounded-lg shadow-xl border border-gray-100 z-20 py-1 text-left">
                                    <button onClick={() => openEditModal(score)} className="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">✏️ 编辑</button>
                                    <button onClick={() => onDelete(score._id)} className="block w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm">🗑 删除</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-end justify-between mb-4 relative z-10">
                         <div className="flex items-baseline gap-1">
                             <span className="text-4xl font-extrabold text-emerald-600">{score.totalScore}</span>
                             <span className="text-xs text-gray-400 font-medium">({score.frontNine}/{score.backNine})</span>
                         </div>
                         <div className="flex flex-col gap-1">
                             {/* 推杆/3推 */}
                             <div className="bg-blue-50 px-2 py-1 rounded-lg">
                                 <div className="text-[10px] text-blue-400 font-bold uppercase">Putts/3P</div>
                                 <div className="font-bold text-blue-700 flex justify-center gap-1">
                                    <span>{score.totalPutts}</span>
                                    <span className="text-blue-300">/</span>
                                    <span className={`${score.threePutts > 0 ? 'text-red-500' : 'text-blue-400'}`}>{score.threePutts || 0}</span>
                                 </div>
                             </div>
                             
                             {/* FIR/GIR */}
                             <div className="bg-purple-50 px-2 py-1 rounded-lg">
                                 <div className="text-[10px] text-purple-400 font-bold uppercase">FIR/GIR</div>
                                 <div className="font-bold text-purple-700 flex justify-center gap-1">
                                    <span>{score.fairwaysHit || '-'}</span>
                                    <span className="text-purple-300">/</span>
                                    <span>{score.totalGir}</span>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* 新增统计数据显示 */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {/* OB/爆洞 */}
                        <div className="bg-red-50 px-2 py-1 rounded-lg">
                            <div className="text-[10px] text-red-400 font-bold uppercase">OB/爆洞</div>
                            <div className="font-bold text-red-700 flex justify-center gap-1">
                              <span>{score.totalOb || 0}</span>
                              <span className="text-red-300">/</span>
                              <span className={`${score.doubleBogeys > 0 ? 'text-orange-600' : 'text-red-400'}`}>
                                {score.doubleBogeys || 0}
                              </span>
                            </div>
                        </div>
                        
                        {/* 鸡/Par/鸟 */}
                        <div className="bg-green-50 px-2 py-1 rounded-lg">
                            <div className="text-[10px] text-green-400 font-bold uppercase">鸡/Par/鸟</div>
                            <div className="font-bold flex justify-center gap-1">
                              <span className="text-orange-500">{score.bogeys || 0}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-green-600">{score.pars || 0}</span>
                              <span className="text-gray-300">/</span>
                              <span className="text-blue-600">{score.birdies || 0}</span>
                            </div>
                        </div>
                    </div>

                    {score.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500 italic flex gap-1 relative z-10">
                            <span>📝</span>
                            <span className="line-clamp-2">{score.notes}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* --- 编辑弹窗 --- */}
      {isEditModalOpen && editingScore && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg animate-fadeIn max-h-[90vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">编辑成绩</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition">&times;</button>
             </div>
             
             <form onSubmit={handleUpdateSubmit} className="space-y-4">
                {/* 1. 球场 & 日期 */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="col-span-2">
                       <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">球场</label>
                       <input className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" name="courseName" value={editingScore.courseName} onChange={handleEditChange} />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">日期</label>
                       <input type="date" className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none" name="date" value={editingScore.date.substring(0,10)} onChange={handleEditChange} />
                   </div>
                   <div>
                       <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tee</label>
                       <select name="tees" value={editingScore.tees} onChange={handleEditChange} className="w-full border border-gray-200 rounded-lg p-3 text-sm outline-none bg-white">
                           <option value="Black">⚫️ Black</option>
                           <option value="Gold">🟡 Gold</option>
                           <option value="Blue">🔵 Blue</option>
                           <option value="White">⚪️ White</option>
                           <option value="Red">🔴 Red</option>
                       </select>
                   </div>
                </div>

                {/* 2. 核心数据 (前九/后九/总杆) */}
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                             <label className="text-[10px] text-gray-500 uppercase block mb-1">前九</label>
                             <input type="number" className="w-full text-center p-2 rounded border border-gray-200" name="frontNine" value={editingScore.frontNine} onChange={handleEditChange} />
                        </div>
                        <div>
                             <label className="text-[10px] text-gray-500 uppercase block mb-1">后九</label>
                             <input type="number" className="w-full text-center p-2 rounded border border-gray-200" name="backNine" value={editingScore.backNine} onChange={handleEditChange} />
                        </div>
                        <div>
                             <label className="text-[10px] text-emerald-700 font-bold uppercase block mb-1">总杆</label>
                             <input type="number" className="w-full text-center p-2 rounded border border-emerald-200 font-bold text-emerald-700" name="totalScore" value={editingScore.totalScore} onChange={handleEditChange} />
                        </div>
                    </div>
                </div>

                {/* 3. 详细数据 */}
                <div className="grid grid-cols-3 gap-3">
                     {/* 第一行 */}
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">推杆 (总)</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center" name="totalPutts" value={editingScore.totalPutts} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">三推洞</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-red-400" name="threePutts" value={editingScore.threePutts || 0} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-red-500 uppercase mb-1 block">OB / 罚杆</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-red-500" name="totalOb" value={editingScore.totalOb} onChange={handleEditChange} />
                     </div>
                     
                     {/* 第二行 */}
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">GIR (标On)</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center" name="totalGir" value={editingScore.totalGir} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">FIR (上球道)</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center" name="fairwaysHit" value={editingScore.fairwaysHit || 0} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-orange-500 uppercase mb-1 block">爆洞</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-orange-500" name="doubleBogeys" value={editingScore.doubleBogeys || 0} onChange={handleEditChange} />
                     </div>
                     
                     {/* 第三行 */}
                     <div>
                         <label className="text-xs font-bold text-orange-400 uppercase mb-1 block">鸡洞</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-orange-400" name="bogeys" value={editingScore.bogeys || 0} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-green-600 uppercase mb-1 block">Par洞</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-green-600" name="pars" value={editingScore.pars || 0} onChange={handleEditChange} />
                     </div>
                     <div>
                         <label className="text-xs font-bold text-blue-600 uppercase mb-1 block">鸟洞</label>
                         <input type="number" className="w-full border border-gray-200 rounded-lg p-2 text-center text-blue-600" name="birdies" value={editingScore.birdies || 0} onChange={handleEditChange} />
                     </div>
                </div>

                {/* 4. 语音备注 */}
                <div>
                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">备注</label>
                     <VoiceTextarea value={editingScore.notes || ''} onChange={handleEditChange} placeholder="输入备注..." />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                     <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-gray-100 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 transition">取消</button>
                     <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition">保存修改</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsChart;
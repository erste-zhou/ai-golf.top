// client/src/pages/Dashboard.jsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatsChart from '../components/StatsChart';

function Dashboard() {
  const [scores, setScores] = useState([]);
  const navigate = useNavigate();
  
  // 1. 获取用户信息
  const user = JSON.parse(localStorage.getItem('user'));

  // 2. 把获取数据定义为一个独立函数
  const fetchScores = useCallback(async () => {
    if (!user || !user.email) return;

    try {
      console.log(`📡 发起请求: /scores?email=${user.email}`); // 调试日志
      const res = await fetch(`https://ai-golf-tracker.onrender.com/scores?email=${user.email}`);
      const data = await res.json();
      
      console.log("✅ 后端返回数据:", data); // 看看这里到底是不是空的
      
      if (Array.isArray(data)) {
        setScores(data);
      } else {
        setScores([]);
      }
    } catch (err) {
      console.error("❌ 获取数据失败:", err);
    }
  }, [user?.email]); // 只有当邮箱变了才重新定义这个函数

  // 3. 页面加载时执行一次
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchScores();
    }
    // ⚠️ 注意：依赖数组里不要放 location.key 了，只放 fetchScores
  }, [user, navigate, fetchScores]);

  // 删除功能
  const handleDelete = async (id) => {
    if(!window.confirm("确定删除？")) return;
    try {
      await fetch(`https://ai-golf-tracker.onrender.com/delete-score/${id}`, { method: 'DELETE' });
      // 删除后，从前端状态移除，不用重新拉取
      setScores(prev => prev.filter(s => s._id !== id));
    } catch (e) { console.error(e); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">欢迎, {user.name}</h1>
          <button 
            onClick={() => navigate('/add-score')}
            className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          >
            + 记分
          </button>
        </div>

        {/* 调试信息：如果还是没图，把这行取消注释，看看页面上显示什么 */}
        {/* <pre className="bg-gray-200 p-2 text-xs">{JSON.stringify(scores, null, 2)}</pre> */}

        <StatsChart scores={scores} onDelete={handleDelete} />
      </div>
    </div>
  );
}

export default Dashboard;

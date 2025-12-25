import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  
  // 每次渲染Navbar时，都检查一下本地存储里有没有用户
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    // 1. 清除本地存储
    localStorage.removeItem('user');
    // 2.以此触发页面更新（React Router跳转会触发重新渲染）
    navigate('/login');
  };

  return (
    <nav className="bg-green-700 text-white p-4 shadow-md">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        {/* 左侧：Logo / 首页链接 */}
        <Link to="/" className="text-xl font-bold flex items-center gap-2">
          ⛳️ 高尔夫记分卡
        </Link>

        {/* 右侧：根据登录状态显示不同内容 */}
        <div className="flex gap-4 items-center">
          {user ? (
            // === 已登录显示 ===
            <>
              <span className="hidden md:inline text-green-100 text-sm">
                你好, {user.name || user.email}
              </span>
              <Link to="/add-score" className="hover:text-green-200 transition">
                记分
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition"
              >
                退出
              </button>
            </>
          ) : (
            // === 未登录显示 ===
            <>
              <Link to="/login" className="hover:text-green-200 transition">
                登录
              </Link>
              <Link to="/register" className="bg-white text-green-700 px-3 py-1 rounded font-bold hover:bg-gray-100 transition">
                注册
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

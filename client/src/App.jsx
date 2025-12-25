// 注意：这里不再引入 BrowserRouter 或 Router，只引入 Routes 和 Route
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import AddScore from './pages/AddScorepage'; // 这里引入的是上面第二步的页面(Page)，不是组件
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    /* 
      这里删除了 <Router> 包裹，
      因为你的 main.jsx 肯定已经有了 BrowserRouter。
      只保留 Routes 即可恢复显示。
    */
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/add-score" element={<AddScore />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddScoreForm from '../components/AddScoreForm'; 
import Navbar from '../components/Navbar'; 

const AddScorePage = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // 1. 读取用户信息
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      // 没登录，滚回登录页
      alert("请先登录！");
      navigate('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      // 2. 存入 State
      setCurrentUser(parsedUser);
      console.log("当前用户:", parsedUser);
    } catch (e) {
      console.error("用户数据损坏", e);
      localStorage.removeItem('user');
      navigate('/login');
    }
  }, [navigate]);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-10">
      <Navbar />

      <div className="max-w-xl mx-auto py-6 px-4">
        <h1 className="text-2xl font-extrabold text-center mb-6 text-green-800 tracking-tight">
          高尔夫记分卡
        </h1>
        
        {/* 3. 传入 Email，并在成功后跳转 */}
        <AddScoreForm 
            userEmail={currentUser.email} 
            onSuccess={() => {
              navigate('/');
            }} 
        />
      </div>
    </div>
  );
};

export default AddScorePage;

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. 引入 useNavigate 用于页面跳转

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate(); // 2. 初始化跳转工具

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => { // 3. 注意这里加了 async，因为网络请求是异步的
    e.preventDefault();
    
    // 简单的密码一致性检查
    if (formData.password !== formData.confirmPassword) {
      alert("两次输入的密码不一致！");
      return;
    }

    try {
      // 4. 发送请求给后端 (fetch)
      const response = await fetch('https://ai-golf-tracker.onrender.com/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // 5. 注册成功
        alert('注册成功！快去登陆吧');
        navigate('/login'); // 跳转到登陆页
      } else {
        // 6. 注册失败 (比如邮箱已存在)
        alert(data.error || '注册失败，请重试');
      }

    } catch (error) {
      console.error('网络错误:', error);
      alert('服务器连接失败，请确保后端已启动');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
          注册 Golf Tracker
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-gray-700 mb-2">昵称</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="老虎伍兹"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">电子邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="tiger@golf.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="至少6位"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">确认密码</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-200 font-bold"
          >
            立即注册
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 text-sm">
          已经有账号了？ 
          <Link to="/login" className="text-green-600 hover:underline ml-1">
            直接登陆
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;

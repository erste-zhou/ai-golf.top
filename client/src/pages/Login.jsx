import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // 1. 引入跳转工具

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const navigate = useNavigate(); // 2. 初始化

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // 3. 发送登陆请求
      const response = await fetch('https://ai-golf-tracker.onrender.com/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 4. 登陆成功
        // alert(`欢迎回来，${data.user.name}！`); // 这个弹窗可以去掉了，体验更好
        
        // ★★★ 新增：保存用户信息到本地 ★★★
        localStorage.setItem('user', JSON.stringify(data.user));

        // ★★★ 修改：跳转到仪表盘 ★★★
        navigate('/dashboard'); 
      }  else {
        // 6. 登陆失败 (密码错或无用户)
        alert(data.error || '登陆失败');
      }

    } catch (error) {
      console.error('网络错误:', error);
      alert('无法连接服务器');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
          欢迎回来
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">电子邮箱</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="请输入注册邮箱"
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
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition duration-200 font-bold"
          >
            登 陆
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600 text-sm">
          还没有账号？ 
          <Link to="/register" className="text-green-600 hover:underline ml-1">
            去注册一个
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;

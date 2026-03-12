import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码至少需要 6 位');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('https://ai-golf-tracker.onrender.com/reset-password/' + token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || '重置失败');
      }
    } catch (error) {
      console.error('网络错误:', error);
      setError('无法连接服务器');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-green-600 text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">密码重置成功！</h2>
          <p className="text-gray-600 mb-4">正在跳转到登录页面...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
          设置新密码
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2">新密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
              placeholder="至少 6 位"
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
            disabled={loading}
            className={`w-full py-2 rounded transition duration-200 font-bold ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <p className="mt-6 text-center text-gray-600 text-sm">
          <Link to="/login" className="text-green-600 hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;

import { useState } from 'react';
import { Link } from 'react-router-dom';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://ai-golf-tracker.onrender.com/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setSubmitted(true);
      
      if (response.ok) {
        console.log('✅ 重置邮件已发送');
      } else {
        alert(data.error || '发送失败');
      }
    } catch (error) {
      console.error('网络错误:', error);
      alert('无法连接服务器');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-6">
          忘记密码
        </h2>

        {!submitted ? (
          <>
            <p className="text-gray-600 text-center mb-6">
              输入您的注册邮箱，我们将发送密码重置链接
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">电子邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-green-500"
                  placeholder="请输入注册邮箱"
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
                {loading ? '发送中...' : '发送重置链接'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="text-green-600 text-5xl mb-4">✅</div>
            <p className="text-gray-700 mb-4">
              如果 <strong>{email}</strong> 已注册，您将收到密码重置邮件
            </p>
            <p className="text-gray-500 text-sm mb-6">
              请检查邮箱（包括垃圾邮件箱）
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-gray-600 text-sm">
          <Link to="/login" className="text-green-600 hover:underline">
            返回登录
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;

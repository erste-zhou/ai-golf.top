// src/components/VoiceTextarea.jsx
import React, { useState, useEffect } from 'react';

const VoiceTextarea = ({ value, onChange, placeholder, rows = 3 }) => {
  const [isListening, setIsListening] = useState(false);
  const [supportError, setSupportError] = useState(false);

  // 浏览器兼容性处理
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  useEffect(() => {
    if (!SpeechRecognition) {
      setSupportError(true);
    }
  }, []);

  const startListening = () => {
    if (supportError) {
      alert("抱歉，您的浏览器不支持语音识别，请使用 Chrome 或 Safari。");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN'; // 设置为中文
    recognition.continuous = false; // 说完一句自动停止
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // 将识别到的文字拼接到原有文字后面（加个空格）
      const newValue = value ? `${value} ${transcript}` : transcript;
      
      // 模拟一个 event 对象返回给父组件，保持接口一致
      onChange({
        target: {
          name: 'notes', // 注意：这里写死了 name，或者你可以通过 props 传进来
          value: newValue
        }
      });
    };

    recognition.onerror = (event) => {
      console.error("语音识别错误:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="relative">
      <textarea
        name="notes"
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm pr-10 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      
      {/* 麦克风按钮 */}
      <button
        type="button"
        onClick={startListening}
        disabled={isListening}
        className={`absolute right-2 bottom-2 p-2 rounded-full transition-all ${
          isListening 
            ? 'bg-red-500 text-white animate-pulse' 
            : 'bg-gray-100 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600'
        }`}
        title="点击开始语音输入"
      >
        {isListening ? (
          // 录音中的图标 (波形)
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
          </svg>
        ) : (
          // 普通麦克风图标
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default VoiceTextarea;

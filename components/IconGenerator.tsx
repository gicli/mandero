import React, { useState } from 'react';
import { generateAppIcon } from '../services/iconService';

interface IconGeneratorProps {
  onBack: () => void;
}

const IconGenerator: React.FC<IconGeneratorProps> = ({ onBack }) => {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = await generateAppIcon();
      if (url) {
        setIconUrl(url);
      } else {
        setError('아이콘 생성에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (err) {
      console.error(err);
      setError('오류가 발생했습니다. API 설정을 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl bg-white sketch-border p-8 flex flex-col items-center">
      <h2 className="text-3xl font-bold mb-6">iOS 앱 아이콘 생성</h2>
      <p className="text-slate-600 mb-8 text-center">
        '맘대로 알람'의 감성을 담은 고화질 iOS 앱 아이콘을 생성합니다.<br/>
        Apple의 디자인 가이드를 준수하는 세련된 아이콘을 만나보세요.
      </p>

      <div className="relative w-64 h-64 bg-slate-100 rounded-[3rem] flex items-center justify-center overflow-hidden shadow-inner mb-8 border-4 border-slate-200">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium text-rose-500">아이콘 그리는 중...</p>
          </div>
        ) : iconUrl ? (
          <img src={iconUrl} alt="Generated Icon" className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-400 text-center p-4">
            <p className="text-4xl mb-2">🎨</p>
            <p className="text-sm">버튼을 눌러 생성을 시작하세요</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-4 w-full">
        <button
          onClick={onBack}
          className="flex-1 py-4 sketch-button font-bold text-slate-600"
        >
          뒤로가기
        </button>
        {!iconUrl ? (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-[2] py-4 bg-rose-500 text-white rounded-xl font-bold shadow-lg hover:bg-rose-600 disabled:opacity-50 transition-all"
          >
            아이콘 생성하기
          </button>
        ) : (
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = iconUrl;
              link.download = 'mamdaero-alarm-ios-icon.png';
              link.click();
            }}
            className="flex-[2] py-4 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 transition-all"
          >
            아이콘 다운로드
          </button>
        )}
      </div>
      
      {iconUrl && (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="mt-4 text-sm text-slate-400 hover:text-rose-500 underline"
        >
          다른 스타일로 다시 생성하기
        </button>
      )}
    </div>
  );
};

export default IconGenerator;

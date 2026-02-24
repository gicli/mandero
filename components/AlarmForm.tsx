
import React, { useState, useEffect } from 'react';
import { SOUND_OPTIONS, SKETCH_ILLUSTRATIONS } from '../constants';
import { audioService } from '../services/audioService';
import { IntervalUnit, Alarm, IntervalType } from '../types';

interface AlarmFormProps {
  initialData?: Alarm;
  onSubmit: (data: {
    id?: string;
    title: string;
    startDate: string;
    intervalType: IntervalType;
    intervalValue: number;
    repeatDays: number[];
    intervalUnit: IntervalUnit;
    soundId: string;
    volume: number;
  }) => void;
  onCancel: () => void;
}

const DAYS = [
  { label: '일', value: 0 },
  { label: '월', value: 1 },
  { label: '화', value: 2 },
  { label: '수', value: 3 },
  { label: '목', value: 4 },
  { label: '금', value: 5 },
  { label: '토', value: 6 },
];

const AlarmForm: React.FC<AlarmFormProps> = ({ initialData, onSubmit, onCancel }) => {
  const now = initialData?.startDate ? new Date(initialData.startDate) : new Date();

  const [title, setTitle] = useState(initialData?.title || '');
  
  // 개별 날짜/시간 상태 (직접 입력을 위해 분리)
  const [year, setYear] = useState<number | string>(now.getFullYear());
  const [month, setMonth] = useState<number | string>(now.getMonth() + 1);
  const [day, setDay] = useState<number | string>(now.getDate());
  const [hour, setHour] = useState<number | string>(now.getHours());
  const [minute, setMinute] = useState<number | string>(now.getMinutes());

  const [intervalType, setIntervalType] = useState<IntervalType>(initialData?.intervalType || 'interval');
  const [intervalValue, setIntervalValue] = useState<number | string>(initialData?.intervalValue || 1);
  const [repeatDays, setRepeatDays] = useState<number[]>(initialData?.repeatDays || []);
  const [soundId, setSoundId] = useState(initialData?.soundId || SOUND_OPTIONS[0].id);
  const [volume, setVolume] = useState<number | string>(initialData?.volume || 50);

  const toggleDay = (dayValue: number) => {
    setRepeatDays(prev => 
      prev.includes(dayValue) 
        ? prev.filter(d => d !== dayValue) 
        : [...prev, dayValue].sort()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 입력된 숫자값들로 Date 객체 생성 (Month는 0-indexed)
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    
    onSubmit({
      id: initialData?.id,
      title: title || '나의 알람',
      startDate: startDate.toISOString(),
      intervalType,
      intervalValue: Number(intervalValue) || 0,
      repeatDays,
      intervalUnit: 'days',
      soundId,
      volume: Number(volume) || 0
    });
  };

  const handleSoundSelection = (id: string) => {
    setSoundId(id);
    audioService.play(id, volume);
  };

  return (
    <div className="bg-white p-8 sketch-border max-w-lg w-full shadow-xl">
      <div className="flex items-center gap-4 mb-6 border-b-2 border-slate-100 pb-4">
        <img src={initialData ? SKETCH_ILLUSTRATIONS.EDIT : SKETCH_ILLUSTRATIONS.ALARM} alt="icon" className="w-8 h-8 opacity-70" />
        <h2 className="text-4xl font-bold">{initialData ? '알람 수정하기' : '알람 추가하기'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-2xl font-bold mb-2">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full p-4 sketch-border bg-slate-50 outline-none text-xl"
            autoFocus
          />
        </div>

        {/* 시작 일시 직접 입력 (Typing UI) */}
        <div>
          <label className="block text-2xl font-bold mb-2">시작 일시 (직접 입력)</label>
          <div className="flex flex-wrap items-center gap-2 p-1">
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-20 p-2 sketch-border bg-sky-50 text-center text-xl outline-none"
                placeholder="2025"
              />
              <span className="text-xl font-bold">년</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="12"
                value={month}
                onChange={(e) => setMonth(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-14 p-2 sketch-border bg-sky-50 text-center text-xl outline-none"
                placeholder="10"
              />
              <span className="text-xl font-bold">월</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="1"
                max="31"
                value={day}
                onChange={(e) => setDay(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-14 p-2 sketch-border bg-sky-50 text-center text-xl outline-none"
                placeholder="27"
              />
              <span className="text-xl font-bold">일</span>
            </div>
            <div className="flex items-center gap-1 ml-2">
              <input
                type="number"
                min="0"
                max="23"
                value={hour}
                onChange={(e) => setHour(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-14 p-2 sketch-border bg-orange-50 text-center text-xl outline-none"
                placeholder="09"
              />
              <span className="text-xl font-bold">시</span>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="59"
                value={minute}
                onChange={(e) => setMinute(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-14 p-2 sketch-border bg-orange-50 text-center text-xl outline-none"
                placeholder="30"
              />
              <span className="text-xl font-bold">분</span>
            </div>
          </div>
        </div>

        {/* 볼륨 및 알람 반복 설정 */}
        <div className="space-y-6">
          <div>
            <label className="block text-2xl font-bold mb-2">볼륨: {volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full h-12 accent-sky-300 cursor-pointer"
            />
          </div>

          <div className="sketch-border p-4 bg-slate-50">
            <label className="block text-2xl font-bold mb-4">알람 유형</label>
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={() => setIntervalType('once')}
                className={`flex-1 py-3 sketch-button text-xl font-bold transition-all ${intervalType === 'once' ? 'bg-sky-300 ring-2 ring-sky-500 shadow-md scale-105 text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                일자 지정 (1회)
              </button>
              <button
                type="button"
                onClick={() => intervalType === 'once' && setIntervalType('interval')}
                className={`flex-1 py-3 sketch-button text-xl font-bold transition-all ${intervalType !== 'once' ? 'bg-amber-300 ring-2 ring-amber-500 shadow-md scale-105 text-slate-900' : 'bg-slate-100 text-slate-500'}`}
              >
                반복 설정
              </button>
            </div>

            {intervalType !== 'once' && (
              <div className="pt-4 border-t-2 border-slate-200 border-dashed">
                <div className="grid grid-cols-2 gap-4 items-start">
                  {/* 일자 반복 컬럼 */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setIntervalType('interval')}
                      className={`w-full py-2 sketch-button text-xl font-bold transition-all ${intervalType === 'interval' ? 'bg-amber-300 ring-2 ring-amber-500 shadow-md scale-105 text-slate-900' : 'bg-slate-100 text-slate-500'}`}
                    >
                      일자 반복
                    </button>

                    {intervalType === 'interval' && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            min="1"
                            value={intervalValue}
                            onChange={(e) => setIntervalValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                            className="w-16 p-2 sketch-border bg-emerald-50 outline-none text-xl text-center"
                          />
                          <span className="text-lg font-bold text-slate-700">일 마다</span>
                        </div>
                        {(() => {
                          const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
                          if (!isNaN(startDate.getTime()) && intervalValue) {
                            const nextDate = new Date(startDate);
                            nextDate.setDate(nextDate.getDate() + Number(intervalValue));
                            return (
                              <div className="text-center py-2 bg-emerald-200 rounded-xl border-2 border-emerald-600 shadow-md">
                                <span className="text-lg font-bold text-emerald-950">
                                  💡 다음일자: {nextDate.getMonth() + 1}/{nextDate.getDate()}
                                </span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                  </div>

                  {/* 요일 반복 컬럼 */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setIntervalType('weekly')}
                      className={`w-full py-2 sketch-button text-xl font-bold transition-all ${intervalType === 'weekly' ? 'bg-amber-300 ring-2 ring-amber-500 shadow-md scale-105 text-slate-900' : 'bg-slate-100 text-slate-500'}`}
                    >
                      요일 반복
                    </button>

                    {intervalType === 'weekly' && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {DAYS.map((day) => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-lg font-bold transition-all ${
                              repeatDays.includes(day.value)
                                ? 'bg-rose-400 text-white shadow-md scale-110'
                                : 'bg-white text-slate-400 border border-slate-200'
                            } ${day.value === 0 ? 'text-rose-500' : day.value === 6 ? 'text-blue-500' : ''}`}
                          >
                            {day.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 소리 선택 리스트 */}
        <div>
          <label className="block text-2xl font-bold mb-2">알람 소리 선택</label>
          <div className="h-48 overflow-y-auto p-2 sketch-border bg-slate-50 space-y-2">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound.id}
                type="button"
                onClick={() => handleSoundSelection(sound.id)}
                className={`w-full p-4 text-left flex items-center justify-between transition-all sketch-button border-none hover:bg-slate-100 ${
                  soundId === sound.id 
                  ? 'bg-amber-100 ring-2 ring-amber-400 shadow-inner' 
                  : 'bg-white'
                }`}
              >
                <div>
                  <div className="font-bold text-xl">{sound.name}</div>
                  <div className="text-sm opacity-60 font-sans leading-tight">{sound.description}</div>
                </div>
                <span className="text-2xl">
                  {soundId === sound.id ? '🔊' : '▶'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-4 sketch-button bg-slate-200 text-2xl font-bold"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-4 sketch-button bg-rose-200 text-2xl font-bold"
          >
            {initialData ? '저장하기' : '알람 생성'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlarmForm;

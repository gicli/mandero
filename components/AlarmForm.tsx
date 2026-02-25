
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
  
  // 개별 날짜/시간 상태 (직접 입력을 위해 분리 - 새 알람일 경우 비워둠)
  const [year, setYear] = useState<number | string>(initialData ? now.getFullYear() : '');
  const [month, setMonth] = useState<number | string>(initialData ? now.getMonth() + 1 : '');
  const [day, setDay] = useState<number | string>(initialData ? now.getDate() : '');
  const [hour, setHour] = useState<number | string>(initialData ? now.getHours() : '');
  const [minute, setMinute] = useState<number | string>(initialData ? now.getMinutes() : '');

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

  const getSecondOccurrenceDate = () => {
    if (year === '' || month === '' || day === '' || hour === '' || minute === '') return null;
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    if (isNaN(start.getTime())) return null;

    if (intervalType === 'interval') {
      const second = new Date(start.getTime());
      second.setDate(second.getDate() + (Number(intervalValue) || 1));
      return second;
    } else if (intervalType === 'weekly') {
      if (repeatDays.length === 0) return null;
      
      let firstOccurrence: Date | null = null;
      for (let i = 0; i <= 7; i++) {
        let check = new Date(start.getTime());
        check.setDate(check.getDate() + i);
        if (repeatDays.includes(check.getDay())) {
          firstOccurrence = check;
          break;
        }
      }
      
      if (!firstOccurrence) return null;

      for (let i = 1; i <= 100; i++) {
        let check = new Date(firstOccurrence.getTime());
        check.setDate(check.getDate() + i);
        
        if (repeatDays.includes(check.getDay())) {
           if (intervalValue > 1) {
              const startRef = new Date(start.getTime());
              startRef.setDate(startRef.getDate() - startRef.getDay());
              startRef.setHours(0,0,0,0);
              
              const checkRef = new Date(check.getTime());
              checkRef.setDate(checkRef.getDate() - checkRef.getDay());
              checkRef.setHours(0,0,0,0);
              
              const weekDiff = Math.round((checkRef.getTime() - startRef.getTime()) / (1000 * 60 * 60 * 24 * 7));
              if (weekDiff % (Number(intervalValue) || 1) === 0) {
                return check;
              }
           } else {
             return check;
           }
        }
      }
    }
    return null;
  };

  const secondDate = getSecondOccurrenceDate();
  const secondDateStr = secondDate 
    ? `${String(secondDate.getMonth() + 1).padStart(2, '0')}/${String(secondDate.getDate()).padStart(2, '0')}`
    : '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (year === '' || month === '' || day === '' || hour === '' || minute === '') {
      alert('시작 일시를 모두 입력해주세요.');
      return;
    }
    
    // 입력된 숫자값들로 Date 객체 생성 (Month는 0-indexed)
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    
    if (isNaN(startDate.getTime())) {
      alert('유효하지 않은 날짜입니다.');
      return;
    }

    onSubmit({
      id: initialData?.id,
      title: title || '나의 알람',
      startDate: startDate.toISOString(),
      intervalType,
      intervalValue: Math.max(1, Number(intervalValue) || 1),
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
    <div className="bg-white p-4 sm:p-8 sketch-border max-w-lg w-full shadow-xl">
      <div className="flex items-center gap-4 mb-6 border-b-2 border-slate-100 pb-4">
        <img src={initialData ? SKETCH_ILLUSTRATIONS.EDIT : SKETCH_ILLUSTRATIONS.ALARM} alt="icon" className="w-8 h-8 opacity-70" />
        <h2 className="text-2xl sm:text-4xl font-bold">{initialData ? '알람 수정하기' : '알람 추가하기'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 제목 */}
        <div>
          <label className="block text-base font-bold mb-2 text-slate-600">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full p-2.5 sketch-border bg-slate-50 outline-none text-base"
            autoFocus
          />
        </div>

        {/* 시작 일시 직접 입력 (Ultra Compact UI) */}
        <div className="bg-slate-50 p-3 sketch-border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-base font-bold text-slate-600">시작 일시</label>
            <span className="text-xs text-slate-400 font-sans">직접 입력 가능</span>
          </div>
          <div className="flex items-center gap-1 justify-center bg-white p-2 sketch-border border-dashed">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-14 text-center text-sm outline-none border-b border-slate-200 focus:border-sky-400"
              placeholder="년"
            />
            <span className="text-slate-300">/</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={month}
              onChange={(e) => setMonth(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-8 text-center text-sm outline-none border-b border-slate-200 focus:border-sky-400"
              placeholder="월"
            />
            <span className="text-slate-300">/</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-8 text-center text-sm outline-none border-b border-slate-200 focus:border-sky-400"
              placeholder="일"
            />
            <div className="w-px h-4 bg-slate-200 mx-2"></div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={hour}
              onChange={(e) => setHour(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-8 text-center text-sm outline-none border-b border-slate-200 focus:border-orange-400"
              placeholder="시"
            />
            <span className="text-slate-300">:</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={minute}
              onChange={(e) => setMinute(e.target.value.replace(/[^0-9]/g, ''))}
              className="w-8 text-center text-sm outline-none border-b border-slate-200 focus:border-orange-400"
              placeholder="분"
            />
          </div>
        </div>

        {/* 볼륨 및 알람 반복 설정 */}
        <div className="space-y-6">
          <div>
            <label className="block text-xl sm:text-2xl font-bold mb-2">볼륨: {volume}%</label>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => setVolume(e.target.value === '' ? '' : parseInt(e.target.value))}
              className="w-full h-10 sm:h-12 accent-sky-300 cursor-pointer"
            />
          </div>

          <div className="sketch-border p-3 bg-slate-50">
            <label className="block text-base font-bold mb-3 text-slate-600">알람 유형</label>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setIntervalType('once')}
                className={`flex-1 py-1.5 sketch-button text-sm sm:text-base font-bold transition-all ${intervalType === 'once' ? 'bg-sky-200 ring-1 ring-sky-400 shadow-inner' : 'bg-white opacity-70'}`}
              >
                {/* 모바일에서는 더 짧게 */}
                <span className="sm:hidden">한번</span>
                <span className="hidden sm:inline">일자 지정</span>
              </button>
              <button
                type="button"
                onClick={() => intervalType === 'once' && setIntervalType('interval')}
                className={`flex-1 py-1.5 sketch-button text-sm sm:text-base font-bold transition-all ${intervalType !== 'once' ? 'bg-amber-200 ring-1 ring-amber-400 shadow-inner' : 'bg-white opacity-70'}`}
              >
                반복
              </button>
            </div>

            {intervalType !== 'once' && (
              <div className="pt-3 border-t border-slate-200 border-dashed">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIntervalType('interval');
                      if (intervalType === 'weekly') setIntervalValue(1);
                    }}
                    className={`flex-1 py-1.5 sketch-button text-sm sm:text-base font-bold transition-all ${intervalType === 'interval' ? 'bg-amber-100 ring-1 ring-amber-300 shadow-inner' : 'bg-white opacity-70'}`}
                  >
                    일 반복
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIntervalType('weekly');
                      if (intervalType === 'interval') setIntervalValue(1);
                    }}
                    className={`flex-1 py-1.5 sketch-button text-sm sm:text-base font-bold transition-all ${intervalType === 'weekly' ? 'bg-amber-100 ring-1 ring-amber-300 shadow-inner' : 'bg-white opacity-70'}`}
                  >
                    요일 반복
                  </button>
                </div>

                {intervalType === 'interval' ? (
                  <div className="flex gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center justify-center gap-2 py-1.5 sketch-button bg-emerald-50 ring-1 ring-emerald-300">
                        <input
                          type="number"
                          min="1"
                          value={intervalValue}
                          onChange={(e) => setIntervalValue(e.target.value === '' ? '' : parseInt(e.target.value))}
                          className="w-12 bg-transparent outline-none text-sm text-center font-bold border-b border-emerald-400"
                        />
                        <span className="text-sm font-bold text-emerald-700">일</span>
                      </div>
                      <div className="flex items-center justify-center gap-2 py-1.5 sketch-button bg-slate-50 ring-1 ring-slate-200 border-dashed">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">2차:</span>
                        <span className="text-sm font-bold text-rose-500">{secondDateStr || '--/--'}</span>
                      </div>
                    </div>
                    <div className="flex-1"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between gap-1 overflow-x-auto pb-2">
                      {DAYS.map((day) => (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-lg sm:text-xl font-bold shrink-0 transition-all ${
                            repeatDays.includes(day.value)
                              ? 'bg-rose-400 text-white shadow-md scale-110'
                              : 'bg-white text-slate-400 border border-slate-200'
                          } ${day.value === 0 ? 'text-rose-500' : day.value === 6 ? 'text-blue-500' : ''}`}
                        >
                          {day.label}
                        </button>
                      ))}
                    </div>
                    
                    {/* 주 단위 건너뛰기 설정 (주 건너뜀 형태 - 버튼 스타일) */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <div className="flex-1"></div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="flex items-center justify-center gap-2 py-1.5 sketch-button bg-indigo-50 ring-1 ring-indigo-300">
                          <input
                            type="number"
                            min="0"
                            max="51"
                            value={Number(intervalValue) - 1}
                            onChange={(e) => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                              setIntervalValue(val + 1);
                            }}
                            className="w-10 bg-transparent outline-none text-sm text-center font-bold border-b border-indigo-400"
                          />
                          <span className="text-sm font-bold text-indigo-700">주 건너뜀</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 py-1.5 sketch-button bg-slate-50 ring-1 ring-slate-200 border-dashed">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">2차:</span>
                          <span className="text-sm font-bold text-rose-500">{secondDateStr || '--/--'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-xs text-slate-400 font-sans italic">
                        {Number(intervalValue) === 1 ? '(매주)' : `(${Number(intervalValue)}주 마다)`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 소리 선택 리스트 */}
        <div>
          <label className="block text-xl sm:text-2xl font-bold mb-2">알람 소리 선택</label>
          <div className="h-40 sm:h-48 overflow-y-auto p-2 sketch-border bg-slate-50 space-y-2">
            {SOUND_OPTIONS.map((sound) => (
              <button
                key={sound.id}
                type="button"
                onClick={() => handleSoundSelection(sound.id)}
                className={`w-full p-3 sm:p-4 text-left flex items-center justify-between transition-all sketch-button border-none hover:bg-slate-100 ${
                  soundId === sound.id 
                  ? 'bg-amber-100 ring-2 ring-amber-400 shadow-inner' 
                  : 'bg-white'
                }`}
              >
                <div>
                  <div className="font-bold text-lg sm:text-xl">{sound.name}</div>
                  <div className="text-xs sm:text-sm opacity-60 font-sans leading-tight">{sound.description}</div>
                </div>
                <span className="text-xl sm:text-2xl">
                  {soundId === sound.id ? '🔊' : '▶'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 sm:py-4 sketch-button bg-slate-200 text-xl sm:text-2xl font-bold"
          >
            취소
          </button>
          <button
            type="submit"
            className="flex-1 py-3 sm:py-4 sketch-button bg-rose-200 text-xl sm:text-2xl font-bold"
          >
            {initialData ? '저장' : '생성'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AlarmForm;

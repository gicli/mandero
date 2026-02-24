
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppView, Alarm, IntervalUnit } from './types';
import { SKETCH_ILLUSTRATIONS } from './constants';
import { audioService } from './services/audioService';
import AlarmCard from './components/AlarmCard';
import AlarmForm from './components/AlarmForm';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | undefined>(undefined);
  const [activeAlert, setActiveAlert] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('sketch_alarms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validated = parsed.map((a: any) => ({
          ...a,
          intervalType: a.intervalType || 'interval',
          repeatDays: a.repeatDays || [],
          intervalUnit: 'days'
        }));
        setAlarms(validated);
      } catch (e) {
        console.error("Failed to parse saved alarms", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sketch_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      alarms.forEach(alarm => {
        if (!alarm.isActive) return;
        if (now.getTime() >= new Date(alarm.nextTriggerAt).getTime()) {
          triggerAlarm(alarm);
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [alarms, activeAlert]);

  const calculateNextOccurrence = (baseDate: Date, alarm: { intervalType: string, intervalValue: number, repeatDays: number[] }): Date | null => {
    const next = new Date(baseDate.getTime());
    
    if (alarm.intervalType === 'once') {
      return null;
    }
    
    if (alarm.intervalType === 'interval') {
      next.setDate(next.getDate() + alarm.intervalValue);
    } else {
      // 요일 반복 (Weekly repeat)
      if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
        next.setDate(next.getDate() + 1);
      } else {
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const checkDate = new Date(baseDate.getTime());
          checkDate.setDate(checkDate.getDate() + i);
          if (alarm.repeatDays.includes(checkDate.getDay())) {
            next.setDate(next.getDate() + i);
            found = true;
            break;
          }
        }
        if (!found) next.setDate(next.getDate() + 1);
      }
    }
    
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  };

  const triggerAlarm = useCallback((alarm: Alarm) => {
    if (activeAlert) return;
    setActiveAlert(alarm);
    audioService.startAlarmLoop(alarm.soundId, alarm.volume);
    
    // 알람이 울리면 목록에서 삭제 (사용자 요청: 울린 항목은 삭제되고 다음 순번이 올라옴)
    setAlarms(prev => prev.filter(a => a.id !== alarm.id));
  }, [activeAlert]);

  const sortedAlarms = useMemo(() => {
    return [...alarms].sort((a, b) => new Date(a.nextTriggerAt).getTime() - new Date(b.nextTriggerAt).getTime());
  }, [alarms]);

  const nearestAlarm = useMemo(() => {
    const activeOnes = alarms.filter(a => a.isActive);
    if (activeOnes.length === 0) return null;
    return activeOnes.sort((a, b) => new Date(a.nextTriggerAt).getTime() - new Date(b.nextTriggerAt).getTime())[0];
  }, [alarms]);

  // 남은 시간 계산 로직 (초 단위 생략)
  const timeRemainingString = useMemo(() => {
    if (!nearestAlarm) return "";
    const diff = new Date(nearestAlarm.nextTriggerAt).getTime() - currentTime.getTime();
    if (diff <= 0) return "곧 알람이 울립니다!";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0 || (hours > 0 && minutes === 0)) {
        // 시간이 있고 분이 0인 경우라도 '0분' 보다는 그냥 'N시간'이 깔끔하지만 
        // 사용자 요청에 맞춰 분을 포함하도록 로직을 짭니다.
        parts.push(`${minutes}분`);
    }

    if (parts.length === 0) return "잠시 후 알람이 울립니다";
    
    return parts.join(' ') + " 남았습니다";
  }, [nearestAlarm, currentTime]);

  const handleSaveAlarm = (data: any) => {
    const start = new Date(data.startDate);
    start.setSeconds(0);
    start.setMilliseconds(0);
    
    let nextTrigger = new Date(start.getTime());
    const now = new Date();
    
    // 요일 반복인 경우, 시작일이 오늘이고 시간이 지났다면 다음 요일을 찾아야 함
    // 혹은 시작일 자체가 선택된 요일이 아닐 수 있음
    if (data.intervalType === 'weekly' && data.repeatDays.length > 0) {
      if (!data.repeatDays.includes(nextTrigger.getDay()) || nextTrigger.getTime() < now.getTime()) {
        // 현재 시간 이후의 가장 가까운 선택된 요일 찾기
        let found = false;
        // 오늘부터 7일간 검사
        for (let i = 0; i <= 7; i++) {
          const checkDate = new Date(start.getTime());
          checkDate.setDate(checkDate.getDate() + i);
          if (data.repeatDays.includes(checkDate.getDay())) {
            if (checkDate.getTime() >= now.getTime()) {
              nextTrigger = checkDate;
              found = true;
              break;
            }
          }
        }
        // 만약 못 찾았다면 (이론상 불가능하지만) 내일로 설정
        if (!found) {
           nextTrigger.setDate(nextTrigger.getDate() + 1);
        }
      }
    } else if (data.intervalType === 'once') {
      // 일자 지정 (1회)
      // 사용자가 입력한 시간을 존중함
    } else {
      // 간격 반복 로직
      // 시작일시가 현재보다 과거인 경우에만 다음 발생일을 계산함
      if (nextTrigger.getTime() < now.getTime()) {
        while (nextTrigger && nextTrigger.getTime() < now.getTime()) {
          nextTrigger = calculateNextOccurrence(nextTrigger, data);
        }
      }
    }

    if (data.id) {
      setAlarms(prev => prev.map(a => 
        a.id === data.id 
        ? { ...a, ...data, nextTriggerAt: nextTrigger ? nextTrigger.toISOString() : a.nextTriggerAt } 
        : a
      ));
    } else {
      setAlarms(prev => [
        ...prev, 
        { 
          ...data, 
          id: crypto.randomUUID(), 
          isActive: nextTrigger ? (nextTrigger.getTime() > now.getTime()) : false, 
          nextTriggerAt: nextTrigger ? nextTrigger.toISOString() : new Date().toISOString()
        }
      ]);
    }
    
    setEditingAlarm(undefined);
    setView(AppView.DASHBOARD);
  };

  const stopAlarm = () => {
    setActiveAlert(null);
    audioService.stopAlarmLoop();
  };

  if (activeAlert) {
    return (
      <div className="fixed inset-0 bg-rose-100 flex flex-col items-center justify-center z-50 p-6 text-center">
        <div className="wiggle mb-8"><img src={SKETCH_ILLUSTRATIONS.ALARM} alt="Alert" className="w-64 h-64 mx-auto" /></div>
        <h1 className="text-7xl font-bold text-slate-800 mb-6">{activeAlert.title}</h1>
        <p className="text-3xl text-slate-600 mb-12">알람이 울리고 있습니다!</p>
        <button onClick={stopAlarm} className="px-16 py-8 bg-white sketch-button text-4xl font-bold shadow-2xl hover:scale-110 active:scale-95 transition-transform">알람 끄기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40">
      <nav className="p-6 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView(AppView.DASHBOARD); setEditingAlarm(undefined); }}>
          <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Alarm Clock SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
              {/* Legs */}
              <path d="M25 85 L15 95" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              <path d="M75 85 L85 95" stroke="#334155" strokeWidth="6" strokeLinecap="round" />
              {/* Bells */}
              <circle cx="25" cy="25" r="15" fill="#fbbf24" stroke="#334155" strokeWidth="3" />
              <circle cx="75" cy="25" r="15" fill="#fbbf24" stroke="#334155" strokeWidth="3" />
              {/* Hammer/Top handle */}
              <path d="M45 15 L55 15" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <path d="M50 10 L50 20" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              {/* Body */}
              <circle cx="50" cy="55" r="38" fill="#ef4444" stroke="#334155" strokeWidth="4" />
              {/* Face */}
              <circle cx="50" cy="55" r="30" fill="white" stroke="#334155" strokeWidth="2" />
              {/* Hands */}
              <line x1="50" y1="55" x2="50" y2="35" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <line x1="50" y1="55" x2="65" y2="65" stroke="#334155" strokeWidth="4" strokeLinecap="round" />
              <circle cx="50" cy="55" r="3" fill="#334155" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">맘대로 알람</h1>
        </div>
        <div className="text-2xl font-bold bg-white/50 px-4 py-1 sketch-border">
          {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 mt-4">
        {view === AppView.DASHBOARD && (
          <div className="space-y-10">
            <div className="bg-sky-50 p-6 sketch-border">
              <h3 className="text-lg font-bold text-sky-800 mb-1 uppercase tracking-widest">다음 알람까지</h3>
              {nearestAlarm ? (
                <div>
                  <div className="text-4xl font-bold text-slate-800 mb-1">
                    {timeRemainingString}
                  </div>
                  <div className="text-xl text-emerald-600 font-bold truncate">
                    {nearestAlarm.title} ({new Date(nearestAlarm.nextTriggerAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})
                  </div>
                </div>
              ) : <p className="text-xl text-slate-400 font-bold">활성 알람 없음</p>}
            </div>

            <section>
              <h2 className="text-5xl font-bold mb-6 border-b-4 border-slate-200 pb-2">나의 알람 목록</h2>
              {alarms.length === 0 ? (
                <div className="py-20 text-center bg-white/40 sketch-border border-dashed">
                  <p className="text-3xl text-slate-400 font-bold">등록된 알람이 없습니다.</p>
                </div>
              ) : (
                <div className="bg-white sketch-border overflow-hidden flex flex-col shadow-lg">
                  {sortedAlarms.map((alarm, idx) => (
                    <AlarmCard 
                      key={alarm.id} 
                      alarm={alarm} 
                      onDelete={(id) => confirm('삭제할까요?') && setAlarms(prev => prev.filter(a => a.id !== id))}
                      onEdit={(a) => { setEditingAlarm(a); setView(AppView.CREATE); }}
                      colorIndex={idx}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {view === AppView.CREATE && (
          <div className="flex justify-center py-6">
            <AlarmForm 
              key={editingAlarm?.id || 'new-alarm-form'} 
              initialData={editingAlarm} 
              onSubmit={handleSaveAlarm} 
              onCancel={() => { setEditingAlarm(undefined); setView(AppView.DASHBOARD); }} 
            />
          </div>
        )}
      </main>

      {view === AppView.DASHBOARD && (
        <button 
          onClick={() => { setEditingAlarm(undefined); setView(AppView.CREATE); }}
          className="fixed bottom-12 right-12 w-28 h-28 bg-sky-300 text-white rounded-full flex flex-col items-center justify-center text-xl font-bold shadow-2xl hover:scale-110 active:scale-90 transition-transform z-40 sketch-button border-none"
          title="새 알람 추가"
        >
          <span className="text-5xl leading-none">+</span>
          <span className="text-lg">알람 추가</span>
        </button>
      )}
    </div>
  );
};

export default App;

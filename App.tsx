
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
  const [confirmSkip, setConfirmSkip] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sketch_alarms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0) {
          const sampleTitles = ['아침 기상', '출근 준비', '점심 식사', '운동 시간', '저녁 약속', '취침 준비', '주말 늦잠'];
          const validated = parsed
            .filter((a: any) => !sampleTitles.includes(a.title))
            .map((a: any) => ({
              ...a,
              intervalType: a.intervalType || 'interval',
              repeatDays: a.repeatDays || [],
              intervalUnit: 'days'
            }));
          setAlarms(validated);
        }
      } catch (e) {
        console.error("Failed to parse saved alarms", e);
      }
    }
  }, []);

  // 한 번 더 현재 상태에서 필터링 (이미 로드된 경우 대비)
  useEffect(() => {
    const sampleTitles = ['아침 기상', '출근 준비', '점심 식사', '운동 시간', '저녁 약속', '취침 준비', '주말 늦잠'];
    const hasSamples = alarms.some(a => sampleTitles.includes(a.title));
    if (hasSamples) {
      setAlarms(prev => prev.filter(a => !sampleTitles.includes(a.title)));
    }
  }, [alarms]);

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

  const calculateNextOccurrence = (baseDate: Date, alarm: { intervalType: string, intervalValue: number, repeatDays: number[], startDate: string }): Date | null => {
    const next = new Date(baseDate.getTime());
    const start = new Date(alarm.startDate);
    
    if (alarm.intervalType === 'once') {
      return null;
    }
    
    if (alarm.intervalType === 'interval') {
      next.setDate(next.getDate() + Math.max(1, alarm.intervalValue));
    } else {
      // 요일 반복 (Weekly repeat)
      if (!alarm.repeatDays || alarm.repeatDays.length === 0) {
        next.setDate(next.getDate() + 1);
      } else {
        // 다음 발생 가능한 요일을 찾을 때까지 하루씩 전진
        let found = false;
        // 최대 100일까지만 루프 (무한 루프 방지)
        for (let i = 1; i <= 100; i++) {
          const checkDate = new Date(baseDate.getTime());
          checkDate.setDate(checkDate.getDate() + i);
          
          // 1. 요일이 포함되는지 확인
          if (alarm.repeatDays.includes(checkDate.getDay())) {
            // 2. 주 단위 간격 확인 (intervalValue가 1보다 크면 건너뛰기 로직 적용)
            if (alarm.intervalType === 'weekly' && alarm.intervalValue > 1) {
              // 시작일이 속한 주의 일요일(또는 월요일) 기준으로 몇 주가 지났는지 계산
              // 여기서는 단순하게 시작일로부터의 일수 차이를 7로 나눈 주차를 사용
              const diffTime = checkDate.getTime() - start.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              
              // 시작일이 속한 주를 0주차로 보고, (현재주차 - 시작주차) % 간격 == 0 인지 확인
              // 주의 시작을 일요일로 맞추기 위해 조정이 필요할 수 있으나, 
              // 사용자 경험상 '시작일로부터 N주'가 직관적임
              const startWeekDay = start.getDay();
              const checkWeekDay = checkDate.getDay();
              
              // 시작일이 포함된 주의 일요일 기준 일수 차이
              const startRef = new Date(start.getTime());
              startRef.setDate(startRef.getDate() - startWeekDay);
              startRef.setHours(0, 0, 0, 0);
              
              const checkRef = new Date(checkDate.getTime());
              checkRef.setDate(checkRef.getDate() - checkWeekDay);
              checkRef.setHours(0, 0, 0, 0);
              
              const weekDiff = Math.round((checkRef.getTime() - startRef.getTime()) / (1000 * 60 * 60 * 24 * 7));
              
              const interval = Math.max(1, alarm.intervalValue);
              if (weekDiff % interval === 0) {
                next.setDate(next.getDate() + i);
                found = true;
                break;
              }
            } else {
              next.setDate(next.getDate() + i);
              found = true;
              break;
            }
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
    const occurrences: (Alarm & { instanceTime: string })[] = [];
    
    alarms.forEach(alarm => {
      if (!alarm.isActive) return;
      
      let nextTime: Date | null = new Date(alarm.nextTriggerAt);
      // 각 알람 설정당 최대 10개의 미래 발생 건을 계산
      for (let i = 0; i < 10; i++) {
        if (!nextTime) break;
        occurrences.push({
          ...alarm,
          instanceTime: nextTime.toISOString()
        });
        
        // 다음 발생일 계산
        nextTime = calculateNextOccurrence(nextTime, alarm);
        if (!nextTime) break;
      }
    });

    // 전체 발생 건 중 시간순으로 정렬 후 상위 10개 추출
    return occurrences
      .sort((a, b) => new Date(a.instanceTime).getTime() - new Date(b.instanceTime).getTime())
      .slice(0, 10);
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

    if (parts.length === 0) return { time: "잠시 후 알람이 울립니다", suffix: "" };
    
    return { 
      time: parts.join(' '), 
      suffix: " 남았습니다" 
    };
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

  const handleSkipOccurrence = (id: string) => {
    setAlarms(prev => prev.map(alarm => {
      if (alarm.id !== id) return alarm;
      
      const currentNext = new Date(alarm.nextTriggerAt);
      const nextNext = calculateNextOccurrence(currentNext, alarm);
      
      if (!nextNext) {
        // 'once' type or no more occurrences
        return { ...alarm, isActive: false };
      }
      
      return { ...alarm, nextTriggerAt: nextNext.toISOString() };
    }));
    setConfirmSkip(null);
  };

  if (activeAlert) {
    return (
      <div className="fixed inset-0 bg-rose-100 flex flex-col items-center justify-center z-50 p-6 text-center">
        <div className="wiggle mb-8"><img src={SKETCH_ILLUSTRATIONS.ALARM} alt="Alert" className="w-64 h-64 mx-auto" /></div>
        <h1 className="text-7xl font-bold text-slate-800 mb-6">{activeAlert.title}</h1>
        <p className="text-3xl text-slate-600 mb-12">알람이 울리고 있습니다!</p>
        <button onClick={stopAlarm} className="px-8 py-4 sm:px-16 sm:py-8 bg-white sketch-button text-2xl sm:text-4xl font-bold shadow-2xl hover:scale-110 active:scale-95 transition-transform">알람 끄기</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <nav className="p-3 sm:p-5 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => { setView(AppView.DASHBOARD); setEditingAlarm(undefined); }}>
          <img src={SKETCH_ILLUSTRATIONS.CLOCK} alt="logo" className="w-7 h-7 sm:w-9 sm:h-9" />
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight">맘대로 알람</h1>
        </div>
        <div className="text-base sm:text-xl font-bold bg-white/50 px-2 py-0.5 sm:px-3 sm:py-1 sketch-border">
          {currentTime.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 mt-2">
        {view === AppView.DASHBOARD && (
          <div className="space-y-4 sm:space-y-7">
            <div className="bg-sky-50 p-3 sm:p-5 sketch-border">
              {nearestAlarm ? (
                <div>
                  <div className="text-base sm:text-lg text-emerald-600 font-bold truncate mb-1">
                    {nearestAlarm.title} ({new Date(nearestAlarm.nextTriggerAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})
                  </div>
                  <div className="text-xs sm:text-sm font-normal text-slate-500">
                    {typeof timeRemainingString === 'string' ? (
                      timeRemainingString
                    ) : (
                      <>
                        <span className="font-bold text-slate-800">{timeRemainingString.time}</span>
                        <span className="ml-1">
                          {timeRemainingString.suffix}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              ) : <p className="text-base sm:text-lg text-slate-400 font-bold">활성 알람 없음</p>}
            </div>

            <section>
              <div className="flex justify-between items-end mb-4 border-b-4 border-slate-200 pb-2">
                <h2 className="text-2xl sm:text-4xl font-bold">알람 목록</h2>
              </div>
              {alarms.length === 0 ? (
                <div className="py-10 sm:py-20 text-center bg-white/40 sketch-border border-dashed">
                  <p className="text-xl sm:text-3xl text-slate-400 font-bold">등록된 알람이 없습니다.</p>
                </div>
              ) : (
                <div className="bg-white sketch-border overflow-hidden flex flex-col shadow-lg">
                  {sortedAlarms.map((alarm, idx) => (
                    <AlarmCard 
                      key={`${alarm.id}-${alarm.instanceTime}`} 
                      alarm={{ ...alarm, nextTriggerAt: alarm.instanceTime }} 
                      onDelete={(id) => setConfirmSkip(id)}
                      onEdit={(a) => { setEditingAlarm(a); setView(AppView.CREATE); }}
                      colorIndex={idx}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* 커스텀 삭제(건너뛰기) 확인 모달 */}
            {confirmSkip && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                <div className="bg-white p-6 sm:p-8 sketch-border max-w-sm w-full text-center shadow-2xl">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">알람 시간 넘기기</h3>
                  <p className="text-lg text-slate-600 mb-8">
                    이 시간대의 알람을 목록에서 지우고<br/>
                    다음 예정 시간으로 넘길까요?
                  </p>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setConfirmSkip(null)}
                      className="flex-1 py-3 sketch-button font-bold text-slate-500"
                    >
                      취소
                    </button>
                    <button 
                      onClick={() => handleSkipOccurrence(confirmSkip)}
                      className="flex-1 py-3 bg-rose-500 text-white sketch-button font-bold border-rose-600"
                    >
                      확인
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {view === AppView.CREATE && (
          <div className="flex justify-center py-6">
            <AlarmForm 
              key={editingAlarm?.id || 'new-alarm-form'} 
              initialData={editingAlarm} 
              onSubmit={handleSaveAlarm} 
              onCancel={() => { setEditingAlarm(undefined); setView(AppView.DASHBOARD); }} 
              onDelete={(id) => {
                setAlarms(prev => prev.filter(a => a.id !== id));
                setEditingAlarm(undefined);
                setView(AppView.DASHBOARD);
              }}
            />
          </div>
        )}
      </main>

      {view === AppView.DASHBOARD && (
        <button 
          onClick={() => { setEditingAlarm(undefined); setView(AppView.CREATE); }}
          className="fixed bottom-8 right-[calc(2rem+25%)] sm:bottom-12 sm:right-[calc(3rem+25%)] w-[68px] h-[68px] sm:w-[95px] sm:h-[95px] bg-rose-500 text-white rounded-full flex items-center justify-center shadow-[0_15px_30px_-5px_rgba(244,63,94,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(244,63,94,0.5)] hover:scale-110 active:scale-95 transition-all z-40 border-4 border-white group"
          title="새 알람 추가"
        >
          <span className="text-[40px] sm:text-[60px] leading-none block group-hover:rotate-90 transition-transform duration-300">+</span>
          
          {/* 장식용 원형 테두리 */}
          <div className="absolute inset-0 rounded-full border-2 border-rose-300/30 scale-90 pointer-events-none"></div>
        </button>
      )}
    </div>
  );
};

export default App;

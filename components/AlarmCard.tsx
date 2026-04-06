
import React from 'react';
import { Alarm } from '../types';
import { PASTEL_COLORS, SKETCH_ILLUSTRATIONS } from '../constants';

interface AlarmCardProps {
  alarm: Alarm;
  onDelete: (id: string) => void;
  onEdit: (alarm: Alarm) => void;
  colorIndex: number;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ alarm, onDelete, onEdit, colorIndex }) => {
  // 알람이 비활성화 상태여도 목록에서는 동일한 스타일을 유지하도록 처리
  const bgColor = PASTEL_COLORS[colorIndex % PASTEL_COLORS.length];
  
  // 날짜 포맷팅 (MM/DD 형식)
  const nextDate = new Date(alarm.nextTriggerAt);
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  const dateStr = `${month}/${day}`;
  
  // 시간 (HH:mm)
  const hours = String(nextDate.getHours()).padStart(2, '0');
  const minutes = String(nextDate.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  const getRepeatText = () => {
    if (alarm.intervalType === 'once') {
      return '1회성';
    }
    if (alarm.intervalType === 'interval') {
      return `${alarm.intervalValue}일 마다`;
    }
    const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
    if (!alarm.repeatDays || alarm.repeatDays.length === 0) return '없음';
    
    let text = alarm.repeatDays.length === 7 ? '매일' : alarm.repeatDays.map(d => dayLabels[d]).join(',');
    
    if (alarm.intervalValue > 1) {
      text += ` (${alarm.intervalValue - 1}주 건너뜀)`;
    }
    
    return text;
  };

  return (
    <div className={`flex items-center w-full py-2 px-3 sm:px-4 border-b-2 border-slate-200 ${bgColor} hover:brightness-95 transition-all group`}>
      {/* 1. 알람 시간 및 날짜 (좌측 배치) */}
      <div className="shrink-0 flex flex-col border-r-2 border-slate-300 border-dashed mr-2 sm:mr-3 pr-2 sm:pr-3 min-w-[50px] sm:min-w-[60px] items-center">
        <div className="text-lg sm:text-xl font-bold text-slate-800 leading-none mb-0.5">
          {timeStr}
        </div>
        <div className="text-sm sm:text-base font-bold text-rose-500 leading-none">
          {dateStr}
        </div>
      </div>

      {/* 2. 알람 이름 (중앙) */}
      <div className="flex-1 min-w-0 pr-2">
        <h3 className="text-base sm:text-xl font-bold truncate text-slate-800">
          {alarm.title}
        </h3>
      </div>

      {/* 3. 수정 및 삭제 (우측) */}
      <div className="flex items-center gap-4 sm:gap-8 shrink-0 ml-auto">
        {/* 수정 마크 */}
        <button 
          onClick={() => onEdit(alarm)}
          className="hover:rotate-12 transition-transform active:scale-90 p-1 flex items-center justify-center"
          title="수정하기"
        >
          <img src={SKETCH_ILLUSTRATIONS.EDIT} alt="Edit" className="w-4 h-4 sm:w-5 sm:h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* 삭제 버튼 */}
        <button 
          onClick={() => onDelete(alarm.id)}
          className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-2xl sm:text-3xl font-bold text-slate-400 hover:text-rose-500 transition-colors leading-none pb-0.5"
          title="삭제"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AlarmCard;

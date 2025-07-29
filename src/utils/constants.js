// 時間割の基本設定
export const SCHEDULE_CONFIG = {
  DAYS: ['月', '火', '水', '木', '金'],
  PERIODS: 6,
  CLASS_DURATION: 90, // 分
  BREAK_DURATION: 10, // 分
  LUNCH_BREAK: {
    start: '12:00',
    end: '13:00'
  },
  FIRST_PERIOD_START: '08:50'
};

// 各時限の開始・終了時間を計算
export const PERIOD_TIMES = (() => {
  const times = {};
  let currentTime = new Date(`2000-01-01 ${SCHEDULE_CONFIG.FIRST_PERIOD_START}`);
  
  for (let period = 1; period <= SCHEDULE_CONFIG.PERIODS; period++) {
    const startTime = new Date(currentTime);
    const endTime = new Date(currentTime.getTime() + SCHEDULE_CONFIG.CLASS_DURATION * 60000);
    
    times[period] = {
      start: startTime.toTimeString().slice(0, 5),
      end: endTime.toTimeString().slice(0, 5),
      label: `${period}限`
    };
    
    // 次の時限の開始時間を計算
    currentTime = new Date(endTime.getTime() + SCHEDULE_CONFIG.BREAK_DURATION * 60000);
    
    // 3限の後は昼休憩
    if (period === 2) {
      currentTime = new Date(`2000-01-01 ${SCHEDULE_CONFIG.LUNCH_BREAK.end}`);
    }
  }
  
  return times;
})();

// 曜日のオプション
export const DAY_OPTIONS = SCHEDULE_CONFIG.DAYS.map(day => ({
  value: day,
  label: day
}));

// 時限のオプション
export const PERIOD_OPTIONS = Array.from({ length: SCHEDULE_CONFIG.PERIODS }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}限 (${PERIOD_TIMES[i + 1].start}~${PERIOD_TIMES[i + 1].end})`
})); 
import { forwardRef, useMemo } from 'react';
import { SCHEDULE_CONFIG, PERIOD_TIMES } from '../utils/constants';
import logger from '../utils/logger';

const ScheduleTable = forwardRef(({ classes, onEditClass, onDeleteClass }, ref) => {
  // 今日・現在時刻の情報を計算
  const getTodayLabel = () => {
    const map = ['日', '月', '火', '水', '木', '金', '土'];
    return map[new Date().getDay()];
  };

  const parseHm = (hm) => {
    const [h, m] = hm.split(':').map(Number);
    return h * 60 + m;
  };

  const nowMinutes = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };

  const isNowBetween = (start, end) => {
    const n = nowMinutes();
    return n >= parseHm(start) && n < parseHm(end);
  };

  const isCurrentSlot = (day, period) => {
    try {
      const today = getTodayLabel();
      if (day !== today) return false;
      const timeInfo = PERIOD_TIMES[period];
      if (!timeInfo) return false;
      return isNowBetween(timeInfo.start, timeInfo.end);
    } catch (e) {
      return false;
    }
  };

  const getClassColors = (name = '') => {
    // 名前から安定した色を生成（HSL）
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    return {
      backgroundColor: `hsl(${hue}, 85%, 95%)`,
      borderColor: `hsl(${hue}, 65%, 75%)`,
      color: `hsl(${hue}, 50%, 25%)`
    };
  };

  // 時間割のマトリックスを作成
  const createScheduleMatrix = () => {
    const matrix = {};
    
    // 初期化
    SCHEDULE_CONFIG.DAYS.forEach(day => {
      matrix[day] = {};
      for (let period = 1; period <= SCHEDULE_CONFIG.PERIODS; period++) {
        matrix[day][period] = [];
      }
    });
    
    // 授業を配置
    classes.forEach(classItem => {
      if (matrix[classItem.day] && matrix[classItem.day][classItem.period]) {
        matrix[classItem.day][classItem.period].push(classItem);
      }
    });
    
    logger.debug('時間割マトリックスを作成しました', matrix);
    return matrix;
  };

  const scheduleMatrix = useMemo(() => createScheduleMatrix(), [classes]);
  const todayLabel = getTodayLabel();

  const handleEdit = (classItem) => {
    logger.info('授業の編集を開始します', classItem);
    onEditClass(classItem);
  };

  const handleDelete = (classItem) => {
    logger.info('授業の削除を実行します', classItem);
    onDeleteClass(classItem.id);
  };

  const renderClassCell = (day, period) => {
    const classesInSlot = scheduleMatrix[day][period];
    const isToday = day === todayLabel;
    const isCurrent = isCurrentSlot(day, period);
    
    if (classesInSlot.length === 0) {
      return (
        <td
          key={`${day}-${period}`}
          className={`schedule-cell empty ${isToday ? 'is-today' : ''} ${isCurrent ? 'is-current' : ''}`}
          aria-label={`${day}曜日 ${period}限 空き`}
        >
          <span className="empty-text">-</span>
        </td>
      );
    }

    return (
      <td
        key={`${day}-${period}`}
        className={`schedule-cell filled ${isToday ? 'is-today' : ''} ${isCurrent ? 'is-current' : ''}`}
        aria-label={`${day}曜日 ${period}限`}
      >
        {classesInSlot.map((classItem, index) => (
          <div
            key={classItem.id}
            className="class-item"
            style={getClassColors(classItem.name)}
            title={`${classItem.name}${classItem.teacher ? ` - ${classItem.teacher}` : ''}${classItem.room ? ` @${classItem.room}` : ''}`}
          >
            <div className="class-name">{classItem.name}</div>
            {classItem.teacher && (
              <div className="class-teacher">{classItem.teacher}</div>
            )}
            {classItem.room && (
              <div className="class-room">{classItem.room}</div>
            )}
            <div className="class-actions">
              <button
                onClick={() => handleEdit(classItem)}
                className="btn-edit"
                title="編集"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(classItem)}
                className="btn-delete"
                title="削除"
              >
                🗑️
              </button>
            </div>
            {index < classesInSlot.length - 1 && <hr className="class-separator" />}
          </div>
        ))}
      </td>
    );
  };

  return (
    <div ref={ref} className="schedule-table-container">
      <h2>時間割</h2>
      <div className="table-wrapper">
        <table className="schedule-table">
          <thead>
            <tr>
              <th className="period-header sticky-col">時限</th>
              {SCHEDULE_CONFIG.DAYS.map(day => (
                <th
                  key={day}
                  className={`day-header ${day === todayLabel ? 'is-today' : ''}`}
                  aria-label={`${day}曜日${day === todayLabel ? '（本日）' : ''}`}
                >
                  {day}曜日
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SCHEDULE_CONFIG.PERIODS }, (_, i) => i + 1).flatMap(period => {
              const timeInfo = PERIOD_TIMES[period];
              const rowIsCurrent = isCurrentSlot(todayLabel, period);
              const row = (
                <tr key={`p-${period}`} className={`period-row ${rowIsCurrent ? 'is-current' : ''}`}>
                  <td className="period-cell sticky-col" aria-label={`${period}限 ${timeInfo.start}～${timeInfo.end}`}>
                    <div className="period-number">{period}限</div>
                    <div className="period-time">
                      {timeInfo.start}～{timeInfo.end}
                    </div>
                  </td>
                  {SCHEDULE_CONFIG.DAYS.map(day => 
                    renderClassCell(day, period)
                  )}
                </tr>
              );
              const lunch = period === 2 ? (
                <tr key="lunch" className="lunch-row">
                  <td colSpan={SCHEDULE_CONFIG.DAYS.length + 1}>
                    昼休み（{SCHEDULE_CONFIG.LUNCH_BREAK.start}～{SCHEDULE_CONFIG.LUNCH_BREAK.end}）
                  </td>
                </tr>
              ) : null;
              return lunch ? [row, lunch] : [row];
            })}
          </tbody>
        </table>
      </div>
      
      {classes.length === 0 && (
        <div className="empty-schedule">
          <p>まだ授業が登録されていません。</p>
          <p>上のフォームから授業を追加してください。</p>
        </div>
      )}
      
      {classes.length > 0 && (
        <div className="schedule-summary">
          <p>
            合計 {classes.length} 個の授業が登録されています。
            <span className="legend"><span className="legend-dot today" /> 今日 / <span className="legend-dot current" /> 現在時限</span>
          </p>
        </div>
      )}
    </div>
  );
});

ScheduleTable.displayName = 'ScheduleTable';

export default ScheduleTable; 
import { forwardRef } from 'react';
import { SCHEDULE_CONFIG, PERIOD_TIMES } from '../utils/constants';
import logger from '../utils/logger';

const ScheduleTable = forwardRef(({ classes, onEditClass, onDeleteClass }, ref) => {
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

  const scheduleMatrix = createScheduleMatrix();

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
    
    if (classesInSlot.length === 0) {
      return (
        <td key={`${day}-${period}`} className="schedule-cell empty">
          <span className="empty-text">-</span>
        </td>
      );
    }

    return (
      <td key={`${day}-${period}`} className="schedule-cell filled">
        {classesInSlot.map((classItem, index) => (
          <div key={classItem.id} className="class-item">
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
              <th className="period-header">時限</th>
              {SCHEDULE_CONFIG.DAYS.map(day => (
                <th key={day} className="day-header">
                  {day}曜日
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SCHEDULE_CONFIG.PERIODS }, (_, i) => {
              const period = i + 1;
              const timeInfo = PERIOD_TIMES[period];
              
              return (
                <tr key={period} className="period-row">
                  <td className="period-cell">
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
          <p>合計 {classes.length} 個の授業が登録されています。</p>
        </div>
      )}
    </div>
  );
});

ScheduleTable.displayName = 'ScheduleTable';

export default ScheduleTable; 
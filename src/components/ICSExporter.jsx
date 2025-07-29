import { useState } from 'react';
import { exportToICS, downloadICS } from '../utils/icsExporter';
import logger from '../utils/logger';
import './ICSExporter.css';

const ICSExporter = ({ classes }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [options, setOptions] = useState({
    semesterStart: getCurrentSemesterStart(),
    semesterEnd: '',
    filename: '時間割.ics'
  });
  const [isExporting, setIsExporting] = useState(false);

  // 現在の学期開始日を推定（4月または10月の最初の月曜日）- 日本時間基準
  function getCurrentSemesterStart() {
    // 日本時間で現在日時を取得
    const now = new Date();
    const jstOffset = 9 * 60; // JST = UTC+9
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const jstNow = new Date(utc + (jstOffset * 60000));
    
    const year = jstNow.getFullYear();
    const month = jstNow.getMonth() + 1;
    
    // 4月または10月を基準に学期開始日を設定
    const semesterMonth = month >= 4 && month < 10 ? 4 : 10;
    const semesterStart = new Date(year, semesterMonth - 1, 1);
    
    // 最初の月曜日を見つける
    while (semesterStart.getDay() !== 1) {
      semesterStart.setDate(semesterStart.getDate() + 1);
    }
    
    return semesterStart.toISOString().split('T')[0];
  }

  const handleExport = async () => {
    if (classes.length === 0) {
      alert('エクスポートする授業がありません。');
      return;
    }

    setIsExporting(true);
    
    try {
      const exportOptions = {
        semesterStart: new Date(options.semesterStart + 'T00:00:00'), // 日本時間として解釈
        semesterEnd: options.semesterEnd ? new Date(options.semesterEnd + 'T23:59:59') : null, // 日本時間として解釈
      };

      const icsContent = exportToICS(classes, exportOptions);
      downloadICS(icsContent, options.filename);
      
      setIsModalOpen(false);
      logger.info('時間割のICSエクスポートが完了しました（日本時間）', {
        classCount: classes.length,
        filename: options.filename,
        semesterStart: exportOptions.semesterStart.toLocaleString('ja-JP'),
        semesterEnd: exportOptions.semesterEnd?.toLocaleString('ja-JP')
      });
      
    } catch (error) {
      logger.error('ICSエクスポート中にエラーが発生しました', error);
      alert('エクスポート中にエラーが発生しました。コンソールを確認してください。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-export"
        disabled={classes.length === 0}
        title={classes.length === 0 ? '授業が登録されていません' : 'カレンダー(.ics)形式でエクスポート'}
      >
        📅 ICSエクスポート
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>📅 ICSファイルエクスポート</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="export-info">
                <p>
                  <strong>{classes.length}件</strong>の授業をカレンダー形式(.ics)でエクスポートします。
                </p>
                <p>
                  エクスポートしたファイルは、Google Calendar、Outlook、Apple Calendarなどで読み込めます。
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="semesterStart">学期開始日:</label>
                <input
                  type="date"
                  id="semesterStart"
                  value={options.semesterStart}
                  onChange={(e) => handleInputChange('semesterStart', e.target.value)}
                  className="form-input"
                />
                <small className="form-help">
                  授業が始まる週の日付を指定してください
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="semesterEnd">学期終了日 (オプション):</label>
                <input
                  type="date"
                  id="semesterEnd"
                  value={options.semesterEnd}
                  onChange={(e) => handleInputChange('semesterEnd', e.target.value)}
                  className="form-input"
                />
                <small className="form-help">
                  空欄の場合は開始日から4ヶ月後に設定されます
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="filename">ファイル名:</label>
                <input
                  type="text"
                  id="filename"
                  value={options.filename}
                  onChange={(e) => handleInputChange('filename', e.target.value)}
                  className="form-input"
                  placeholder="時間割.ics"
                />
                <small className="form-help">
                  .ics拡張子は自動で追加されます
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-secondary"
                disabled={isExporting}
              >
                キャンセル
              </button>
              <button
                onClick={handleExport}
                className="btn-primary"
                disabled={isExporting}
              >
                {isExporting ? '📤 エクスポート中...' : '📤 エクスポート'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ICSExporter;

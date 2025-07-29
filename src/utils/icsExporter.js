import { PERIOD_TIMES } from './constants';
import logger from './logger';

/**
 * 時間割データを.ics形式でエクスポートする
 * @param {Array} classes - 授業データの配列
 * @param {Object} options - エクスポートオプション
 */
export const exportToICS = (classes, options = {}) => {
  try {
    const {
      semesterStart = new Date(), // 学期開始日
      semesterEnd = null, // 学期終了日（nullの場合は4ヶ月後）
      excludeWeeks = [], // 除外する週（例：休暇期間）
    } = options;

    // 学期終了日が指定されていない場合は4ヶ月後に設定
    const endDate = semesterEnd || new Date(semesterStart.getTime() + (4 * 30 * 24 * 60 * 60 * 1000));

    const icsHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//時間割アプリ//時間割 1.0//JA',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:時間割',
      'X-WR-TIMEZONE:Asia/Tokyo',
      'BEGIN:VTIMEZONE',
      'TZID:Asia/Tokyo',
      'BEGIN:STANDARD',
      'DTSTART:19700101T000000',
      'TZOFFSETFROM:+0900',
      'TZOFFSETTO:+0900',
      'TZNAME:JST',
      'END:STANDARD',
      'END:VTIMEZONE'
    ].join('\r\n');

    const icsFooter = 'END:VCALENDAR';

    // 各授業をVEVENTに変換
    const events = classes.map(classData => createEvent(classData, semesterStart, endDate, excludeWeeks));

    const icsContent = [icsHeader, ...events, icsFooter].join('\r\n');

    logger.info('ICS形式でのエクスポートが完了しました', {
      classCount: classes.length,
      semesterStart: semesterStart.toISOString(),
      semesterEnd: endDate.toISOString()
    });

    return icsContent;
  } catch (error) {
    logger.error('ICSエクスポート中にエラーが発生しました', error);
    throw error;
  }
};

/**
 * 個別の授業データをVEVENTに変換
 * @param {Object} classData - 授業データ
 * @param {Date} semesterStart - 学期開始日
 * @param {Date} semesterEnd - 学期終了日
 * @param {Array} excludeWeeks - 除外する週
 */
const createEvent = (classData, semesterStart, semesterEnd, excludeWeeks) => {
  const { name, day, period, teacher, room } = classData;
  const periodInfo = PERIOD_TIMES[period];

  // 曜日を数値に変換（月曜=1, 火曜=2, ...）
  const dayMap = { '月': 1, '火': 2, '水': 3, '木': 4, '金': 5 };
  const dayOfWeek = dayMap[day];

  // 最初の授業日を計算
  const firstClassDate = getFirstClassDate(semesterStart, dayOfWeek);

  // 時間を設定
  const [startHour, startMinute] = periodInfo.start.split(':').map(Number);
  const [endHour, endMinute] = periodInfo.end.split(':').map(Number);

  // イベントの開始・終了時刻（日本時間で作成）
  const startDateTime = createJSTDate(firstClassDate, startHour, startMinute);
  const endDateTime = createJSTDate(firstClassDate, endHour, endMinute);

  // 繰り返し終了日（日本時間の日付のみ）
  const untilDate = formatDateForICS(semesterEnd);

  // VEVENT作成
  const event = [
    'BEGIN:VEVENT',
    `UID:${generateUID(classData)}`,
    `DTSTART;TZID=Asia/Tokyo:${formatDateTimeForICS(startDateTime)}`,
    `DTEND;TZID=Asia/Tokyo:${formatDateTimeForICS(endDateTime)}`,
    `RRULE:FREQ=WEEKLY;UNTIL=${untilDate}`,
    `SUMMARY:${escapeText(name)}`,
    `DESCRIPTION:${escapeText(createDescription(classData))}`,
    `LOCATION:${escapeText(room || '')}`,
    `CATEGORIES:授業`,
    `CREATED:${formatDateTimeForICS(new Date())}`,
    `LAST-MODIFIED:${formatDateTimeForICS(new Date())}`,
    'END:VEVENT'
  ].join('\r\n');

  return event;
};

/**
 * 日本時間で指定した日時のDateオブジェクトを作成
 * @param {Date} baseDate - 基準となる日付
 * @param {Number} hour - 時
 * @param {Number} minute - 分
 */
const createJSTDate = (baseDate, hour, minute) => {
  // 日本時間で正確な日時を作成
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const date = baseDate.getDate();
  
  // 日本時間のDateオブジェクトを作成（UTCオフセットを考慮）
  const jstDate = new Date(year, month, date, hour, minute, 0, 0);
  return jstDate;
};

/**
 * 学期開始日から最初の授業日を計算
 * @param {Date} semesterStart - 学期開始日
 * @param {Number} targetDayOfWeek - 目標曜日（1=月曜日）
 */
const getFirstClassDate = (semesterStart, targetDayOfWeek) => {
  const date = new Date(semesterStart);
  const currentDayOfWeek = date.getDay();
  const adjustedCurrentDay = currentDayOfWeek === 0 ? 7 : currentDayOfWeek; // 日曜日を7に調整

  let daysToAdd = targetDayOfWeek - adjustedCurrentDay;
  if (daysToAdd < 0) {
    daysToAdd += 7; // 次の週の該当曜日
  }

  date.setDate(date.getDate() + daysToAdd);
  return date;
};

/**
 * 授業の説明文を作成
 * @param {Object} classData - 授業データ
 */
const createDescription = (classData) => {
  const { day, period, teacher, room } = classData;
  const periodInfo = PERIOD_TIMES[period];
  
  const parts = [
    `曜日: ${day}曜日`,
    `時限: ${period}限 (${periodInfo.start}～${periodInfo.end})`,
  ];

  if (teacher) {
    parts.push(`担当: ${teacher}`);
  }

  if (room) {
    parts.push(`教室: ${room}`);
  }

  return parts.join('\\n');
};

/**
 * 日時をICS形式にフォーマット（日本時間として）
 * @param {Date} date - 日時オブジェクト
 */
const formatDateTimeForICS = (date) => {
  // 日本時間として扱うため、ローカル時間を使用
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
};

/**
 * 日付をICS形式にフォーマット（日付のみ、日本時間）
 * @param {Date} date - 日付オブジェクト
 */
const formatDateForICS = (date) => {
  // 日本時間として扱う
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}T235959`; // 終了日は23:59:59に設定
};

/**
 * ICS用のユニークIDを生成
 * @param {Object} classData - 授業データ
 */
const generateUID = (classData) => {
  const { name, day, period } = classData;
  const timestamp = Date.now();
  return `${name}-${day}-${period}-${timestamp}@class-schedule-app`;
};

/**
 * ICS用のテキストをエスケープ
 * @param {String} text - エスケープするテキスト
 */
const escapeText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * ICSファイルをダウンロード
 * @param {String} icsContent - ICSファイルの内容
 * @param {String} filename - ファイル名
 */
export const downloadICS = (icsContent, filename = '時間割.ics') => {
  try {
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(url);
    
    logger.info('ICSファイルのダウンロードが開始されました', { filename });
  } catch (error) {
    logger.error('ICSファイルのダウンロード中にエラーが発生しました', error);
    throw error;
  }
};

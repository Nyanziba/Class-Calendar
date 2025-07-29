class Logger {
  constructor() {
    this.logPrefix = '[時間割アプリ]';
  }

  info(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    console.log(`${this.logPrefix} [INFO] ${timestamp} - ${message}`);
    if (data) {
      console.log('データ:', data);
    }
  }

  error(message, error = null) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    console.error(`${this.logPrefix} [ERROR] ${timestamp} - ${message}`);
    if (error) {
      console.error('エラー詳細:', error);
    }
  }

  warn(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    console.warn(`${this.logPrefix} [WARN] ${timestamp} - ${message}`);
    if (data) {
      console.warn('データ:', data);
    }
  }

  debug(message, data = null) {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    console.debug(`${this.logPrefix} [DEBUG] ${timestamp} - ${message}`);
    if (data) {
      console.debug('データ:', data);
    }
  }

  // 授業関連の専用ログ
  classAdded(classData) {
    this.info('授業が追加されました', classData);
  }

  classUpdated(oldData, newData) {
    this.info('授業が更新されました');
    console.log('更新前:', oldData);
    console.log('更新後:', newData);
  }

  classDeleted(classData) {
    this.info('授業が削除されました', classData);
  }

  validationError(field, message) {
    this.warn(`入力検証エラー - ${field}: ${message}`);
  }

  scheduleGenerated(schedule) {
    this.info('時間割が生成されました');
    console.table(schedule);
  }
}

// シングルトンパターンでloggerインスタンスを作成
const logger = new Logger();

export default logger; 
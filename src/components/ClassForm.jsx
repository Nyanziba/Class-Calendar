import { useState, useEffect } from 'react';
import { DAY_OPTIONS, PERIOD_OPTIONS } from '../utils/constants';
import logger from '../utils/logger';

const ClassForm = ({ onSubmit, editingClass, onCancel }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    day: '',
    period: '',
    teacher: '',
    room: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingClass) {
      setFormData(editingClass);
      logger.info('編集モードでフォームを開きました', editingClass);
    } else {
      setFormData({
        id: '',
        name: '',
        day: '',
        period: '',
        teacher: '',
        room: ''
      });
      logger.info('新規追加モードでフォームを開きました');
    }
  }, [editingClass]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = '授業名は必須です';
      logger.validationError('授業名', '必須項目が入力されていません');
    }

    if (!formData.day) {
      newErrors.day = '曜日を選択してください';
      logger.validationError('曜日', '選択されていません');
    }

    if (!formData.period) {
      newErrors.period = '時限を選択してください';
      logger.validationError('時限', '選択されていません');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      logger.warn('フォーム検証エラーのため送信を中止しました');
      return;
    }

    const classData = {
      ...formData,
      id: formData.id || Date.now().toString(),
      name: formData.name.trim(),
      teacher: formData.teacher.trim(),
      room: formData.room.trim()
    };

    onSubmit(classData);
    
    if (!editingClass) {
      logger.info('新しい授業を送信しました', classData);
      // 新規追加の場合はフォームをリセット
      setFormData({
        id: '',
        name: '',
        day: '',
        period: '',
        teacher: '',
        room: ''
      });
    } else {
      logger.info('授業の編集を送信しました', classData);
    }
    
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // エラーをクリア
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCancel = () => {
    logger.info('フォームの編集をキャンセルしました');
    onCancel();
    setErrors({});
  };

  return (
    <div className="class-form">
      <h3>{editingClass ? '授業を編集' : '新しい授業を追加'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">授業名 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={errors.name ? 'error' : ''}
            placeholder="例: 情報処理基礎論"
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="day">曜日 *</label>
          <select
            id="day"
            name="day"
            value={formData.day}
            onChange={handleChange}
            className={errors.day ? 'error' : ''}
          >
            <option value="">選択してください</option>
            {DAY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.day && <span className="error-message">{errors.day}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="period">時限 *</label>
          <select
            id="period"
            name="period"
            value={formData.period}
            onChange={handleChange}
            className={errors.period ? 'error' : ''}
          >
            <option value="">選択してください</option>
            {PERIOD_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.period && <span className="error-message">{errors.period}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="teacher">教員名</label>
          <input
            type="text"
            id="teacher"
            name="teacher"
            value={formData.teacher}
            onChange={handleChange}
            placeholder="例: 田中 太郎"
          />
        </div>

        <div className="form-group">
          <label htmlFor="room">教室</label>
          <input
            type="text"
            id="room"
            name="room"
            value={formData.room}
            onChange={handleChange}
            placeholder="例: A101"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {editingClass ? '更新' : '追加'}
          </button>
          {editingClass && (
            <button type="button" onClick={handleCancel} className="btn-secondary">
              キャンセル
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ClassForm; 
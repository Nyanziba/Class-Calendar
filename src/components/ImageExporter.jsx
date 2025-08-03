import { useState, useRef, useEffect } from 'react';
import { exportScheduleAsImage, generatePreview, IMAGE_SIZES } from '../utils/imageExporter';
import logger from '../utils/logger';
import './ImageExporter.css';

const ImageExporter = ({ classes, scheduleRef }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [options, setOptions] = useState({
    size: IMAGE_SIZES.PHONE_WALLPAPER,
    format: 'png',
    quality: 1,
    backgroundColor: '#ffffff',
    padding: 40,
    filename: '時間割表'
  });

  // プレビューを生成
  const generatePreviewImage = async () => {
    if (!scheduleRef?.current || classes.length === 0) return;
    
    try {
      const preview = await generatePreview(scheduleRef.current, options.size, options.backgroundColor);
      setPreviewUrl(preview);
    } catch (error) {
      logger.error('プレビュー生成エラー', error);
    }
  };

  // オプションが変更されたときにプレビューを更新
  useEffect(() => {
    if (isModalOpen && scheduleRef?.current && classes.length > 0) {
      const timeoutId = setTimeout(generatePreviewImage, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [isModalOpen, options.size, options.backgroundColor, classes.length]);

  const handleExport = async () => {
    if (!scheduleRef?.current || classes.length === 0) {
      alert('エクスポートする時間割がありません。');
      return;
    }

    setIsExporting(true);
    
    try {
      await exportScheduleAsImage(scheduleRef.current, options);
      setIsModalOpen(false);
      logger.info('時間割画像のエクスポートが完了しました', {
        filename: options.filename,
        size: `${options.size.width}×${options.size.height}`,
        format: options.format
      });
    } catch (error) {
      logger.error('画像エクスポート中にエラーが発生しました', error);
      alert('エクスポート中にエラーが発生しました。コンソールを確認してください。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleOptionChange = (field, value) => {
    setOptions(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSizeChange = (sizeKey) => {
    setOptions(prev => ({
      ...prev,
      size: IMAGE_SIZES[sizeKey]
    }));
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-image-export"
        disabled={classes.length === 0}
        title={classes.length === 0 ? '授業が登録されていません' : '時間割を画像として保存'}
      >
        🖼️ 画像保存
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content image-export-modal">
            <div className="modal-header">
              <h3>🖼️ 画像エクスポート</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close"
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="export-content">
                <div className="export-options">
                  <div className="export-info">
                    <p>
                      時間割表を<strong>画像ファイル</strong>として保存します。
                    </p>
                    <p>
                      スマホの壁紙やSNS投稿、印刷などに使用できます。
                    </p>
                  </div>

                  <div className="form-group">
                    <label>画像サイズ:</label>
                    <div className="size-options">
                      {Object.entries(IMAGE_SIZES).map(([key, size]) => (
                        <label key={key} className="size-option">
                          <input
                            type="radio"
                            name="size"
                            checked={options.size === size}
                            onChange={() => handleSizeChange(key)}
                          />
                          <div className="size-info">
                            <div className="size-name">{size.name}</div>
                            <div className="size-description">{size.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="format">ファイル形式:</label>
                      <select
                        id="format"
                        value={options.format}
                        onChange={(e) => handleOptionChange('format', e.target.value)}
                        className="form-input"
                      >
                        <option value="png">PNG（高品質・透明度対応）</option>
                        <option value="jpg">JPG（小サイズ・背景色固定）</option>
                      </select>
                    </div>

                    {options.format === 'jpg' && (
                      <div className="form-group">
                        <label htmlFor="quality">画質:</label>
                        <select
                          id="quality"
                          value={options.quality}
                          onChange={(e) => handleOptionChange('quality', parseFloat(e.target.value))}
                          className="form-input"
                        >
                          <option value={1}>最高品質</option>
                          <option value={0.9}>高品質</option>
                          <option value={0.8}>標準品質</option>
                          <option value={0.7}>圧縮品質</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="backgroundColor">背景色:</label>
                      <div className="color-options">
                        <label className="color-option">
                          <input
                            type="radio"
                            name="backgroundColor"
                            value="#ffffff"
                            checked={options.backgroundColor === '#ffffff'}
                            onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                          />
                          <span className="color-preview white"></span>
                          白
                        </label>
                        <label className="color-option">
                          <input
                            type="radio"
                            name="backgroundColor"
                            value="#000000"
                            checked={options.backgroundColor === '#000000'}
                            onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                          />
                          <span className="color-preview black"></span>
                          黒
                        </label>
                        <label className="color-option">
                          <input
                            type="radio"
                            name="backgroundColor"
                            value="#f8f9fa"
                            checked={options.backgroundColor === '#f8f9fa'}
                            onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                          />
                          <span className="color-preview gray"></span>
                          グレー
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="filename">ファイル名:</label>
                      <input
                        type="text"
                        id="filename"
                        value={options.filename}
                        onChange={(e) => handleOptionChange('filename', e.target.value)}
                        className="form-input"
                        placeholder="時間割表"
                      />
                    </div>
                  </div>
                </div>

                <div className="preview-section">
                  <h4>プレビュー</h4>
                  <div className="preview-container">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="プレビュー" 
                        className="preview-image"
                      />
                    ) : (
                      <div className="preview-placeholder">
                        <div className="loading-spinner"></div>
                        <p>プレビューを生成中...</p>
                      </div>
                    )}
                  </div>
                  <div className="preview-info">
                    <p>
                      <strong>サイズ:</strong> {options.size.width} × {options.size.height}px
                    </p>
                    <p>
                      <strong>形式:</strong> {options.format.toUpperCase()}
                    </p>
                  </div>
                </div>
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
                {isExporting ? '🖼️ 生成中...' : '🖼️ 画像を保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageExporter;

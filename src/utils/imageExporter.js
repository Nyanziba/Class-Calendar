import html2canvas from 'html2canvas';
import logger from './logger';

/**
 * HTML要素を画像として保存するためのユーティリティ
 */

// 画像サイズの定義
export const IMAGE_SIZES = {
  PHONE_WALLPAPER: {
    name: 'スマホ壁紙',
    width: 1080,
    height: 1920,
    description: 'スマートフォンの壁紙に適したサイズ (1080×1920)'
  },
  TABLET_WALLPAPER: {
    name: 'タブレット壁紙', 
    width: 1536,
    height: 2048,
    description: 'タブレットの壁紙に適したサイズ (1536×2048)'
  },
  DESKTOP_WALLPAPER: {
    name: 'デスクトップ壁紙',
    width: 1920,
    height: 1080,
    description: 'デスクトップの壁紙に適したサイズ (1920×1080)'
  },
  SQUARE: {
    name: '正方形',
    width: 1080,
    height: 1080,
    description: 'SNS投稿に適した正方形サイズ (1080×1080)'
  },
  A4: {
    name: 'A4サイズ',
    width: 2480,
    height: 3508,
    description: 'A4印刷に適したサイズ (300dpi)'
  }
};

/**
 * 時間割表をキャプチャして画像として保存
 * @param {HTMLElement} element - キャプチャする要素
 * @param {Object} options - エクスポートオプション
 */
export const exportScheduleAsImage = async (element, options = {}) => {
  const {
    filename = '時間割',
    format = 'png',
    size = IMAGE_SIZES.PHONE_WALLPAPER,
    quality = 1,
    backgroundColor = '#ffffff',
    padding = 40
  } = options;

  try {
    logger.info('画像エクスポートを開始します', {
      filename,
      format,
      size: `${size.width}×${size.height}`,
      quality
    });

    // 元の要素のスタイルを保存
    const originalStyle = {
      transform: element.style.transform,
      width: element.style.width,
      height: element.style.height,
      position: element.style.position,
      top: element.style.top,
      left: element.style.left
    };

    // 高解像度でキャプチャするための設定
    const canvas = await html2canvas(element, {
      backgroundColor: backgroundColor,
      scale: 2, // 高解像度
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      removeContainer: true,
      ignoreElements: (element) => {
        // ボタンなどの操作要素を除外
        return element.classList?.contains('btn') || 
               element.classList?.contains('modal') ||
               element.tagName === 'BUTTON';
      }
    });

    // 指定サイズに合わせてリサイズ
    const resizedCanvas = resizeCanvas(canvas, size, backgroundColor, padding);
    
    // 画像をダウンロード
    downloadCanvasAsImage(resizedCanvas, filename, format, quality);
    
    // 元のスタイルを復元
    Object.keys(originalStyle).forEach(key => {
      if (originalStyle[key] !== undefined) {
        element.style[key] = originalStyle[key];
      }
    });

    logger.info('画像エクスポートが完了しました', {
      filename: `${filename}.${format}`,
      finalSize: `${resizedCanvas.width}×${resizedCanvas.height}`
    });

    return true;
  } catch (error) {
    logger.error('画像エクスポート中にエラーが発生しました', error);
    throw error;
  }
};

/**
 * Canvasを指定サイズにリサイズ
 * @param {HTMLCanvasElement} originalCanvas - 元のCanvas
 * @param {Object} targetSize - 目標サイズ
 * @param {String} backgroundColor - 背景色
 * @param {Number} padding - 余白
 */
const resizeCanvas = (originalCanvas, targetSize, backgroundColor, padding) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  
  // 背景色を設定
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // 元の画像をコンテンツエリア内に収まるようにスケーリング
  const contentWidth = canvas.width - (padding * 2);
  const contentHeight = canvas.height - (padding * 2);
  
  const scaleX = contentWidth / originalCanvas.width;
  const scaleY = contentHeight / originalCanvas.height;
  const scale = Math.min(scaleX, scaleY);
  
  const scaledWidth = originalCanvas.width * scale;
  const scaledHeight = originalCanvas.height * scale;
  
  // 中央に配置
  const x = (canvas.width - scaledWidth) / 2;
  const y = (canvas.height - scaledHeight) / 2;
  
  // 高品質でリサイズ
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  ctx.drawImage(originalCanvas, x, y, scaledWidth, scaledHeight);
  
  // 時間割タイトルを追加（上部中央）
  addTitle(ctx, canvas.width, y, backgroundColor);
  
  return canvas;
};

/**
 * キャンバスにタイトルを追加
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Number} canvasWidth - Canvas幅
 * @param {Number} contentY - コンテンツのY位置
 * @param {String} backgroundColor - 背景色
 */
const addTitle = (ctx, canvasWidth, contentY, backgroundColor) => {
  if (contentY < 100) return; // スペースが足りない場合はスキップ
  
  const title = '📅 時間割表';
  const now = new Date();
  const dateStr = now.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  // タイトルのスタイル
  ctx.fillStyle = backgroundColor === '#ffffff' ? '#333333' : '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 48px "Hiragino Sans", "ヒラギノ角ゴシック", "Yu Gothic", "游ゴシック", sans-serif';
  
  // タイトルを描画
  ctx.fillText(title, canvasWidth / 2, contentY - 40);
  
  // 日付を描画
  ctx.font = '24px "Hiragino Sans", "ヒラギノ角ゴシック", "Yu Gothic", "游ゴシック", sans-serif';
  ctx.fillText(dateStr, canvasWidth / 2, contentY - 10);
};

/**
 * Canvasを画像として保存
 * @param {HTMLCanvasElement} canvas - 保存するCanvas
 * @param {String} filename - ファイル名
 * @param {String} format - 画像フォーマット
 * @param {Number} quality - 品質（JPEG用）
 */
const downloadCanvasAsImage = (canvas, filename, format, quality) => {
  const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
  const dataURL = canvas.toDataURL(mimeType, quality);
  
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = dataURL;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * プレビュー用の小さなキャンバスを生成
 * @param {HTMLElement} element - キャプチャする要素
 * @param {Object} size - 目標サイズ
 */
export const generatePreview = async (element, size) => {
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 0.5, // プレビュー用に低解像度
      useCORS: true,
      removeContainer: true,
      ignoreElements: (element) => {
        return element.classList?.contains('btn') || 
               element.classList?.contains('modal') ||
               element.tagName === 'BUTTON';
      }
    });
    
    // プレビュー用に小さくリサイズ
    const previewCanvas = document.createElement('canvas');
    const ctx = previewCanvas.getContext('2d');
    
    const previewWidth = 200;
    const previewHeight = Math.round((size.height / size.width) * previewWidth);
    
    previewCanvas.width = previewWidth;
    previewCanvas.height = previewHeight;
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, previewWidth, previewHeight);
    
    const scale = Math.min(previewWidth / canvas.width, previewHeight / canvas.height);
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    const x = (previewWidth - scaledWidth) / 2;
    const y = (previewHeight - scaledHeight) / 2;
    
    ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
    
    return previewCanvas.toDataURL();
  } catch (error) {
    logger.error('プレビュー生成中にエラーが発生しました', error);
    return null;
  }
};

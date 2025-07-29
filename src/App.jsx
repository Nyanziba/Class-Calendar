import { useState, useEffect, useRef } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import ClassForm from './components/ClassForm'
import ScheduleTable from './components/ScheduleTable'
import ICSExporter from './components/ICSExporter'
import ImageExporter from './components/ImageExporter'
import logger from './utils/logger'
import './App.css'

function App() {
  const [classes, setClasses] = useState([])
  const [editingClass, setEditingClass] = useState(null)
  const scheduleRef = useRef(null) // 時間割表の参照用

  // LocalStorageからデータを読み込み
  useEffect(() => {
    logger.info('アプリケーションを初期化中...')
    const savedClasses = localStorage.getItem('schedule-classes')
    if (savedClasses) {
      try {
        const parsedClasses = JSON.parse(savedClasses)
        setClasses(parsedClasses)
        logger.info('LocalStorageから授業データを読み込みました', parsedClasses)
      } catch (error) {
        logger.error('LocalStorageからのデータ読み込みに失敗しました', error)
      }
    } else {
      logger.info('LocalStorageに保存された授業データはありません')
    }
  }, [])

  // LocalStorageにデータを保存
  useEffect(() => {
    if (classes.length > 0) {
      localStorage.setItem('schedule-classes', JSON.stringify(classes))
      logger.info('LocalStorageに授業データを保存しました')
    }
  }, [classes])

  const handleAddClass = (classData) => {
    const existingClassIndex = classes.findIndex(c => c.id === classData.id)
    
    if (existingClassIndex >= 0) {
      // 編集の場合
      const oldClass = classes[existingClassIndex]
      const updatedClasses = [...classes]
      updatedClasses[existingClassIndex] = classData
      setClasses(updatedClasses)
      logger.classUpdated(oldClass, classData)
      setEditingClass(null)
    } else {
      // 新規追加の場合
      setClasses(prev => [...prev, classData])
      logger.classAdded(classData)
    }
  }

  const handleEditClass = (classData) => {
    setEditingClass(classData)
    logger.info('授業の編集モードに切り替えました', classData)
  }

  const handleDeleteClass = (classId) => {
    const classToDelete = classes.find(c => c.id === classId)
    if (classToDelete) {
      if (window.confirm(`「${classToDelete.name}」を削除しますか？`)) {
        setClasses(prev => prev.filter(c => c.id !== classId))
        logger.classDeleted(classToDelete)
        
        // 編集中の授業が削除された場合は編集モードを終了
        if (editingClass && editingClass.id === classId) {
          setEditingClass(null)
        }
      } else {
        logger.info('授業の削除がキャンセルされました', classToDelete)
      }
    }
  }

  const handleCancelEdit = () => {
    setEditingClass(null)
    logger.info('編集モードを終了しました')
  }

  const handleClearAllClasses = () => {
    if (window.confirm('すべての授業を削除しますか？この操作は取り消せません。')) {
      setClasses([])
      setEditingClass(null)
      localStorage.removeItem('schedule-classes')
      logger.info('すべての授業を削除しました')
    }
  }

  // デバッグ用：現在の状態をコンソールに出力
  const handleDebugInfo = () => {
    logger.info('=== デバッグ情報 ===')
    logger.info('現在の授業数', classes.length)
    logger.info('全授業データ', classes)
    logger.info('編集中の授業', editingClass)
    
    if (classes.length > 0) {
      logger.scheduleGenerated(classes)
    }
  }

  logger.debug('Appコンポーネントがレンダリングされました', {
    classCount: classes.length,
    isEditing: !!editingClass
  })

  return (
    <div className="app">
      <header className="app-header">
        <h1>📅 時間割アプリ</h1>
        <div className="header-actions">
          <button onClick={handleDebugInfo} className="btn-debug">
            📊 デバッグ情報
          </button>
          <ICSExporter classes={classes} />
          <ImageExporter classes={classes} scheduleRef={scheduleRef} />
          {classes.length > 0 && (
            <button onClick={handleClearAllClasses} className="btn-danger">
              🗑️ 全削除
            </button>
          )}
        </div>
      </header>

      <main className="app-main">
        <section className="form-section">
          <ClassForm
            onSubmit={handleAddClass}
            editingClass={editingClass}
            onCancel={handleCancelEdit}
          />
        </section>

        <section className="schedule-section">
          <ScheduleTable
            ref={scheduleRef}
            classes={classes}
            onEditClass={handleEditClass}
            onDeleteClass={handleDeleteClass}
          />
        </section>
      </main>

      <footer className="app-footer">
        <p>
          💡 コンソール（F12）を開くと詳細なログが確認できます
        </p>
      </footer>
    </div>
  )
}

export default App

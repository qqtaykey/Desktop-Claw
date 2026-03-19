import React, { useState, useRef, useCallback, useEffect } from 'react'
import { ChatBubble } from '../ChatBubble'
import './styles.css'

const GREETINGS = [
  '在呢～',
  '有什么需要帮忙的吗？',
  '今天怎么样？',
  '嗨～',
  '我在这里 🐾',
  '今天辛苦了！',
  '需要我做点什么吗？',
  '😊',
  '你好呀～',
  '陪着你呢'
]

interface Props {
  onDoubleClick?: () => void
}

export function FloatingBall({ onDoubleClick }: Props): React.JSX.Element {
  const [bubble, setBubble] = useState<{ id: number; text: string } | null>(null)
  const movedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const bubbleIdRef = useRef(0)
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ballRef = useRef<HTMLDivElement>(null)
  const listenersRef = useRef<{ onMove: () => void; onUp: (e: MouseEvent) => void } | null>(null)

  // 组件卸载时保底清除 window 事件监听器
  useEffect(() => {
    return () => {
      if (listenersRef.current) {
        window.removeEventListener('mousemove', listenersRef.current.onMove)
        window.removeEventListener('mouseup', listenersRef.current.onUp)
        listenersRef.current = null
      }
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current)
      }
    }
  }, [])

  const handleSingleClick = useCallback(() => {
    const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)]
    bubbleIdRef.current += 1
    setBubble({ id: bubbleIdRef.current, text })
  }, [])

  const handleBubbleDismiss = useCallback(() => {
    setBubble(null)
  }, [])

  // 透明区域点击穿透：鼠标进入球时接收事件，离开时穿透
  const handleMouseEnter = useCallback(() => {
    window.electronAPI.setIgnoreMouseEvents(false)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (!isDraggingRef.current) {
      window.electronAPI.setIgnoreMouseEvents(true)
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return // 仅左键
      e.preventDefault()
      movedRef.current = false
      isDraggingRef.current = true
      window.electronAPI.dragStart()

      const onMove = (): void => {
        movedRef.current = true
        window.electronAPI.dragMove()
      }

      const onUp = (ev: MouseEvent): void => {
        window.electronAPI.dragEnd()
        isDraggingRef.current = false

        // 检查鼠标是否仍在球上，不在则恢复点击穿透
        const rect = ballRef.current?.getBoundingClientRect()
        if (rect) {
          const isOver =
            ev.clientX >= rect.left &&
            ev.clientX <= rect.right &&
            ev.clientY >= rect.top &&
            ev.clientY <= rect.bottom
          if (!isOver) {
            window.electronAPI.setIgnoreMouseEvents(true)
          }
        }

        // 没有发生移动才算点击（区分单击 / 双击）
        if (!movedRef.current) {
          if (clickTimerRef.current) {
            // 250ms 内第二次点击 → 双击
            clearTimeout(clickTimerRef.current)
            clickTimerRef.current = null
            onDoubleClick?.()
          } else {
            // 第一次点击，等待可能的双击
            clickTimerRef.current = setTimeout(() => {
              clickTimerRef.current = null
              handleSingleClick()
            }, 250)
          }
        }

        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        listenersRef.current = null
      }

      listenersRef.current = { onMove, onUp }
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [onDoubleClick, handleSingleClick]
  )

  return (
    <div className="ball-root">
      <div className="bubble-area">
        {bubble && (
          <ChatBubble
            key={bubble.id}
            message={bubble}
            duration={3000}
            onDismiss={handleBubbleDismiss}
          />
        )}
      </div>
      <div
        ref={ballRef}
        className="ball"
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
        title="Claw 🐾"
      >
        <span className="ball__icon">🐾</span>
      </div>
    </div>
  )
}

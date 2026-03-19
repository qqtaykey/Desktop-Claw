import React, { useEffect, useState, useRef } from 'react'
import './styles.css'

interface Props {
  message: { id: number; text: string }
  duration?: number
  onDismiss?: () => void
}

export function ChatBubble({ message, duration = 3000, onDismiss }: Props): React.JSX.Element {
  const [hiding, setHiding] = useState(false)
  const dismissRef = useRef(onDismiss)
  dismissRef.current = onDismiss

  useEffect(() => {
    setHiding(false)

    const hideTimer = setTimeout(() => {
      setHiding(true)
    }, duration)

    const removeTimer = setTimeout(() => {
      dismissRef.current?.()
    }, duration + 300)

    return () => {
      clearTimeout(hideTimer)
      clearTimeout(removeTimer)
    }
  }, [message.id, duration])

  return (
    <div className={`chat-bubble${hiding ? ' chat-bubble--hiding' : ''}`}>
      <span className="chat-bubble__text">{message.text}</span>
      <div className="chat-bubble__tail" />
    </div>
  )
}

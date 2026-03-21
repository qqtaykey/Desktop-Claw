/** WebSocket 消息信封 per ARCHITECTURE.md §6.2 */
export interface WsEnvelope {
  id: string
  type: WsMessageType
  taskId: string
  ts: string
  payload: Record<string, unknown>
}

/** Client → Server */
export type ClientMessageType = 'task.create' | 'task.cancel'

/** Server → Client */
export type ServerMessageType =
  | 'task.ack'
  | 'task.token'
  | 'task.done'
  | 'task.error'
  | 'task.cancelled'
  | 'conversation.history'

export type WsMessageType = ClientMessageType | ServerMessageType

/** Payload 类型定义 */
export interface TaskCreatePayload { content: string }
export interface TaskAckPayload { content: string }
export interface TaskTokenPayload { delta: string }
export interface TaskDonePayload { content: string }
export interface TaskErrorPayload { code: string; message: string }

import type { ToolCall } from './tool'

export interface ChatMessageData {
  role: 'user' | 'assistant' | 'tool'
  content: string
  /** assistant 消息中 LLM 返回的 tool_calls */
  tool_calls?: ToolCall[]
  /** tool 消息对应的 tool_call id */
  tool_call_id?: string
}

export interface ConversationHistoryPayload {
  messages: ChatMessageData[]
}

import { contextBridge } from 'electron'

// 通过 contextBridge 向渲染进程安全暴露 API
// Milestone A 阶段将在此处添加真实 IPC 通道
contextBridge.exposeInMainWorld('electronAPI', {
  // placeholder — IPC channels will be added in Milestone A
})

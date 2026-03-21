import { writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname } from 'path'
import type { ToolDefinition, ToolResult } from '@desktop-claw/shared'
import { validatePath, getDefaultAllowedRoots } from './path-security'

export const writeFileTool: ToolDefinition = {
  schema: {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        '创建新文件或覆写已有文件。将指定内容写入给定路径。使用前请确认是否会覆盖已有文件。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '要写入的文件绝对路径'
          },
          content: {
            type: 'string',
            description: '要写入的文件内容'
          }
        },
        required: ['path', 'content']
      }
    }
  },

  execute: async (args): Promise<ToolResult> => {
    const filePath = args.path as string
    const content = args.content as string

    if (!filePath) {
      return { success: false, content: '', error: '缺少 path 参数' }
    }
    if (typeof content !== 'string') {
      return { success: false, content: '', error: '缺少 content 参数' }
    }

    // 路径安全校验
    const check = validatePath(filePath, getDefaultAllowedRoots())
    if (!check.valid) {
      return { success: false, content: '', error: check.error }
    }

    const resolved = check.resolved
    const existed = existsSync(resolved)

    try {
      // 确保目录存在
      const dir = dirname(resolved)
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true })
      }

      writeFileSync(resolved, content, 'utf-8')

      const action = existed ? '已覆写' : '已创建'
      return {
        success: true,
        content: `${action}文件: ${resolved} (${content.length} 字符)`
      }
    } catch (err) {
      return {
        success: false,
        content: '',
        error: `写入失败: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  }
}

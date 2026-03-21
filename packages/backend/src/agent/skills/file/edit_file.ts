import { readFileSync, writeFileSync, existsSync } from 'fs'
import type { ToolDefinition, ToolResult } from '@desktop-claw/shared'
import { validatePath, getDefaultAllowedRoots } from './path-security'

export const editFileTool: ToolDefinition = {
  schema: {
    type: 'function',
    function: {
      name: 'edit_file',
      description:
        '通过字符串替换修改已有文件。将文件中 old_text 精确匹配的部分替换为 new_text。old_text 必须与文件内容完全一致。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '要编辑的文件绝对路径'
          },
          old_text: {
            type: 'string',
            description: '要被替换的原始文本（必须精确匹配文件中的内容）'
          },
          new_text: {
            type: 'string',
            description: '替换后的新文本'
          }
        },
        required: ['path', 'old_text', 'new_text']
      }
    }
  },

  execute: async (args): Promise<ToolResult> => {
    const filePath = args.path as string
    const oldText = args.old_text as string
    const newText = args.new_text as string

    if (!filePath) {
      return { success: false, content: '', error: '缺少 path 参数' }
    }
    if (typeof oldText !== 'string') {
      return { success: false, content: '', error: '缺少 old_text 参数' }
    }
    if (typeof newText !== 'string') {
      return { success: false, content: '', error: '缺少 new_text 参数' }
    }

    // 路径安全校验
    const check = validatePath(filePath, getDefaultAllowedRoots())
    if (!check.valid) {
      return { success: false, content: '', error: check.error }
    }

    const resolved = check.resolved

    if (!existsSync(resolved)) {
      return { success: false, content: '', error: `文件不存在: ${resolved}` }
    }

    try {
      const content = readFileSync(resolved, 'utf-8')

      // 精确匹配检查
      const matchCount = content.split(oldText).length - 1
      if (matchCount === 0) {
        return {
          success: false,
          content: '',
          error: '未找到匹配的 old_text，请确认文本完全一致（包括空格和换行）'
        }
      }
      if (matchCount > 1) {
        return {
          success: false,
          content: '',
          error: `old_text 在文件中匹配了 ${matchCount} 处，应只匹配 1 处。请提供更精确的文本`
        }
      }

      // 执行替换
      const newContent = content.replace(oldText, newText)
      writeFileSync(resolved, newContent, 'utf-8')

      return {
        success: true,
        content: `已编辑文件: ${resolved}（替换了 ${oldText.length} → ${newText.length} 字符）`
      }
    } catch (err) {
      return {
        success: false,
        content: '',
        error: `编辑失败: ${err instanceof Error ? err.message : String(err)}`
      }
    }
  }
}

import { readFileSync, existsSync, statSync } from 'fs'
import { extname } from 'path'
import type { ToolDefinition, ToolResult } from '@desktop-claw/shared'
import { validatePath, getDefaultAllowedRoots } from './path-security'

/** 文件最大读取大小 512KB */
const MAX_FILE_SIZE = 512 * 1024

/** 纯文本可直接读取的扩展名 */
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.json', '.jsonl',
  '.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs',
  '.py', '.rb', '.go', '.rs', '.java', '.c', '.cpp', '.h', '.hpp',
  '.html', '.htm', '.css', '.scss', '.less', '.sass',
  '.xml', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf',
  '.sh', '.bash', '.zsh', '.fish',
  '.sql', '.graphql', '.gql',
  '.env', '.gitignore', '.editorconfig',
  '.csv', '.tsv', '.log',
  '.vue', '.svelte', '.astro',
  ''  // 无扩展名文件（如 Dockerfile, Makefile）
])

async function readTextFile(filePath: string): Promise<ToolResult> {
  const content = readFileSync(filePath, 'utf-8')
  return { success: true, content }
}

async function readPdf(filePath: string): Promise<ToolResult> {
  try {
    const { PDFParse } = await import('pdf-parse')
    const buffer = readFileSync(filePath)
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    await parser.destroy()
    return { success: true, content: result.text || '（PDF 未提取到文本内容）' }
  } catch (err) {
    return {
      success: false,
      content: '',
      error: `PDF 解析失败: ${err instanceof Error ? err.message : String(err)}`
    }
  }
}

async function readDocx(filePath: string): Promise<ToolResult> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ path: filePath })
    return { success: true, content: result.value || '（DOCX 未提取到文本内容）' }
  } catch (err) {
    return {
      success: false,
      content: '',
      error: `DOCX 解析失败: ${err instanceof Error ? err.message : String(err)}`
    }
  }
}

async function readXlsx(filePath: string): Promise<ToolResult> {
  try {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(readFileSync(filePath))
    const lines: string[] = []
    for (const sheetName of workbook.SheetNames) {
      lines.push(`=== Sheet: ${sheetName} ===`)
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
      lines.push(csv)
    }
    return { success: true, content: lines.join('\n') || '（XLSX 未提取到内容）' }
  } catch (err) {
    return {
      success: false,
      content: '',
      error: `XLSX 解析失败: ${err instanceof Error ? err.message : String(err)}`
    }
  }
}

export const readFileTool: ToolDefinition = {
  schema: {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        '读取指定路径的本地文件内容。支持 .txt, .md, 代码文件的直接读取，以及 .pdf, .docx, .xlsx 的文本提取。',
      parameters: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: '要读取的文件绝对路径'
          }
        },
        required: ['path']
      }
    }
  },

  execute: async (args): Promise<ToolResult> => {
    const filePath = args.path as string
    if (!filePath) {
      return { success: false, content: '', error: '缺少 path 参数' }
    }

    // 路径安全校验
    const check = validatePath(filePath, getDefaultAllowedRoots())
    if (!check.valid) {
      return { success: false, content: '', error: check.error }
    }

    const resolved = check.resolved

    // 文件存在性检查
    if (!existsSync(resolved)) {
      return { success: false, content: '', error: `文件不存在: ${resolved}` }
    }

    // 文件大小检查
    const stat = statSync(resolved)
    if (!stat.isFile()) {
      return { success: false, content: '', error: `路径不是文件: ${resolved}` }
    }
    if (stat.size > MAX_FILE_SIZE) {
      return {
        success: false,
        content: '',
        error: `文件过大 (${(stat.size / 1024).toFixed(0)}KB)，上限 ${MAX_FILE_SIZE / 1024}KB`
      }
    }

    // 根据扩展名选择读取方式
    const ext = extname(resolved).toLowerCase()

    if (ext === '.pdf') return readPdf(resolved)
    if (ext === '.docx') return readDocx(resolved)
    if (ext === '.xlsx' || ext === '.xls') return readXlsx(resolved)

    if (TEXT_EXTENSIONS.has(ext)) return readTextFile(resolved)

    // 未知扩展名，尝试作为文本读取
    try {
      return await readTextFile(resolved)
    } catch {
      return { success: false, content: '', error: `不支持的文件类型: ${ext}` }
    }
  }
}

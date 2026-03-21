import { join } from 'path'
import type { ToolSchema, ToolResult, ToolDefinition } from '@desktop-claw/shared'
import {
  loadSkillsFromDir,
  formatSkillsForPrompt,
  collectToolSchemas,
  type LoadedSkill
} from './skill-primitives'

/**
 * SkillManager — Skill 体系运行时核心
 *
 * 负责：发现 → 加载 → 格式化 → 执行
 */
export class SkillManager {
  private skills: LoadedSkill[] = []
  /** tool name → ToolDefinition 快速查找 */
  private toolMap = new Map<string, ToolDefinition>()
  private loaded = false

  /**
   * 扫描 skills 目录，加载所有 Skill 的元数据 + 正文 + tools
   * MVP：仅扫描内置 skills 目录
   */
  async load(): Promise<void> {
    // 内置 Skills 目录
    const builtinDir = join(__dirname, 'skills')

    this.skills = await loadSkillsFromDir(builtinDir)

    // 构建 tool 查找表
    this.toolMap.clear()
    for (const skill of this.skills) {
      for (const tool of skill.tools) {
        const name = tool.schema.function.name
        if (this.toolMap.has(name)) {
          console.warn(`[skill-manager] duplicate tool name: ${name}`)
        }
        this.toolMap.set(name, tool)
      }
    }

    this.loaded = true
    console.log(
      `[skill-manager] loaded ${this.skills.length} skill(s), ${this.toolMap.size} tool(s)`
    )
  }

  /** 将已激活 Skill 的行为指南格式化为 system prompt 片段 */
  getSkillPrompt(): string {
    if (!this.loaded) return ''
    return formatSkillsForPrompt(this.skills)
  }

  /** 收集所有 ToolSchema[]（传给 LLM 的 tools 参数） */
  getToolSchemas(): ToolSchema[] {
    if (!this.loaded) return []
    return collectToolSchemas(this.skills)
  }

  /** 根据 tool name 执行对应的 tool */
  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.toolMap.get(name)
    if (!tool) {
      return { success: false, content: '', error: `未知的工具: ${name}` }
    }

    console.log(`[skill-manager] executing tool: ${name}`, JSON.stringify(args).slice(0, 200))

    try {
      const result = await tool.execute(args)
      console.log(`[skill-manager] tool ${name} ${result.success ? 'succeeded' : 'failed'}`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[skill-manager] tool ${name} threw:`, message)
      return { success: false, content: '', error: `工具执行异常: ${message}` }
    }
  }

  /** 是否有已加载的 tools */
  hasTools(): boolean {
    return this.toolMap.size > 0
  }
}

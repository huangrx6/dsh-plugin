/** Wire contract shared by the host RPC plugin and the web client. */

export const DSH_SKILL_MANAGER_CHANNEL = '/dsh-skill-manager'

/** Invocation policy mirrors the SKILL.md frontmatter switches. */
export interface SkillInvocationView {
  readonly modelInvocable: boolean
  readonly userInvocable: boolean
}

/** One row of the skill list. */
export interface SkillListItem {
  readonly name: string
  readonly description: string
  readonly whenToUse?: string | undefined
  readonly invocation: SkillInvocationView
  /** Registry layer that owns the entry: user-dsh / user-agents / project-dsh / … / bundled / runtime. */
  readonly source: string
  readonly provider: string
  /** Absolute path of the SKILL.md file for filesystem-backed skills. */
  readonly path?: string | undefined
  /** Skill directory (bundle form); flat files use the containing root. */
  readonly directory?: string | undefined
  /** Rank of the owning root, when known from the local scan (lower wins). */
  readonly rank?: number | undefined
  /** A filesystem entry that lost the name race to a higher layer. */
  readonly shadowed: boolean
  /** The file lives under a root this plugin may import into / delete from. */
  readonly managed: boolean
  /** Optional frontmatter `version` — feeds the market's update badge. */
  readonly version?: string | undefined
  /** Frontmatter failed validation; `invalid` carries the reason. */
  readonly invalid?: string | undefined
}

export interface SkillFileStat {
  readonly name: string
  readonly size: number
  readonly directory: boolean
}

/** Full detail payload behind one skill. */
export interface SkillDetail extends SkillListItem {
  /** Markdown body (frontmatter stripped) — empty when unavailable. */
  readonly content: string
  readonly metadata?: Readonly<Record<string, unknown>> | undefined
  readonly files: readonly SkillFileStat[]
}

export type SkillDestination = 'user-dsh' | 'user-agents'

/** Extra knobs for the import call. */
export interface SkillImportOptions {
  /** Replace an existing skill of the same name (market "update" path). */
  readonly overwrite?: boolean | undefined
}

export type SkillImportSource =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'bytes'; readonly filename: string; readonly base64: string }

export interface SkillImportResult {
  readonly name: string
  readonly path: string
  readonly files: number
  readonly warnings: readonly string[]
}

export interface SkillListResponse {
  readonly skills: readonly SkillListItem[]
}

export interface SkillListRequest {
  readonly cwd?: string | undefined
}

/** How the web client should render one file's preview. */
export type SkillFilePreviewKind = 'text' | 'image' | 'pdf' | 'audio' | 'video' | 'binary'

/**
 * On-demand preview payload for one file inside a skill directory. Text files
 * arrive as a capped string; anything renderable natively (image / pdf /
 * audio / video) arrives as base64 for a blob URL.
 */
export interface SkillFileContent {
  /** Relative path inside the skill directory, as shown in the file tree. */
  readonly file: string
  readonly name: string
  readonly kind: SkillFilePreviewKind
  /** Shiki language id for `kind: 'text'`（'text' 为纯文本兜底）. */
  readonly language?: string | undefined
  readonly mime?: string | undefined
  readonly size: number
  readonly text?: string | undefined
  readonly base64?: string | undefined
  readonly truncated: boolean
}

export interface SkillFileRequest {
  readonly name: string
  readonly file: string
}

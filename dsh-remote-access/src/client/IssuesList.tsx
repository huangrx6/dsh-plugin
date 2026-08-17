import { IconWarningOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DiagnoseIssue } from '../contracts.ts'
import type { RemoteAccessLocaleKey } from './locales.ts'

export interface IssuesListProps {
  readonly t: (key: RemoteAccessLocaleKey) => string
  readonly issues: readonly DiagnoseIssue[]
}

/** 诊断问题列表（纯展示）：每条 = 现象 + 可执行建议。 */
export function IssuesList({ t, issues }: IssuesListProps) {
  if (issues.length === 0) return null
  return (
    <section className="ra-issues">
      <h4 className="ra-issues-title"><IconWarningOutline16 /> {t('issuesTitle')}</h4>
      <ul>
        {issues.map(issue => (
          <li key={issue.code}>
            <p className="ra-issue-message">{issue.message}</p>
            <p className="ra-issue-hint">{t('issueHintPrefix')}：{issue.hint}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

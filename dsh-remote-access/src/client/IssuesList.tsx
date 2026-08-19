import { IconCheckOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { DiagnoseIssue } from '../contracts.ts'
import type { RemoteAccessLocaleKey } from './locales.ts'

export interface IssuesListProps {
  readonly t: (key: RemoteAccessLocaleKey) => string
  readonly issues: readonly DiagnoseIssue[]
}

/**
 * 诊断卡片（纯展示）：每个问题一行 —— 左侧 6px 状态点 + 现象 + 可执行建议；
 * 无问题时给出绿色勾的静止态「一切正常」，不用情绪化空状态。
 */
export function IssuesList({ t, issues }: IssuesListProps) {
  return (
    <section className="dsh-ra-card" aria-label={t('diagnosticsTitle')}>
      <p className="dsh-ra-card-label">{t('diagnosticsTitle')}</p>
      {issues.length === 0
        ? (
          <div className="dsh-ra-ok">
            <span className="dsh-ra-ok-mark" aria-hidden="true"><IconCheckOutline16 /></span>
            <span className="dsh-ra-ok-text">{t('issuesOk')}</span>
          </div>
        )
        : (
          <ul className="dsh-ra-issues">
            {issues.map(issue => (
              <li key={issue.code} className="dsh-ra-issue">
                <span className="dsh-ra-issue-dot" aria-hidden="true" />
                <div className="dsh-ra-issue-body">
                  <p className="dsh-ra-issue-message">{issue.message}</p>
                  <p className="dsh-ra-issue-hint">{t('issueHintPrefix')}：{issue.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}

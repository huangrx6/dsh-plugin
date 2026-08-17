/**
 * dsh-third-party —— client 入口。
 *
 * 在设置页注入「三方能力」section（官方 settings.section 插槽，order 50
 * 排在 Plugins 之后），内容区为横向滚动 tab 容器；tab 由
 * settings.thirdparty.tab 子插槽驱动，各能力插件自行注册、缺席即隐藏。
 *
 * useTabs 的实现照官方 ui-settings-plugins 的 sectionInjected 模式：
 * register options 的 inject 提供 hooks.tabs，从 ctx.slots.entries 读
 * tab 行（id/order/label），slots ledger 与 locale 任一变化即失效重算。
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { resolveSlotLabel } from '@deepseek-ai/dsh-client-ui-slots'
import '@deepseek-ai/dsh-client-locale/client'
import '@deepseek-ai/dsh-client-ui-settings/client'
import { ThirdPartySection } from './ThirdPartySection.tsx'
import { installStyles } from './styles.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'settings.thirdParty': 'nav' | 'title' | 'intro' | 'empty' | 'tabs'
  }
  interface SlotMap {
    'settings.thirdparty.tab': {
      readonly id: string
      readonly order: number
      readonly label: string
    }
  }
}

const NS = 'settings.thirdParty'
const TAB_SLOT = 'settings.thirdparty.tab'

const zhCN = {
  nav: '三方能力',
  title: '三方能力',
  intro: '社区/第三方插件提供的能力面板集中在这里。',
  empty: '尚无已安装的三方能力插件。',
  tabs: '三方能力面板',
}
const enUS = {
  nav: 'Third-party',
  title: 'Third-party',
  intro: 'Panels contributed by community / third-party plugins live here.',
  empty: 'No third-party capability plugins installed.',
  tabs: 'Third-party panels',
}

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh: zhCN, en: enUS }), 'dsh-third-party: dictionaries')
  const t = ctx.locale.bind(NS)

  ctx.effect(() => installStyles(document), 'dsh-third-party: styles')

  // 照官方 sectionInjected：tab 行 store（slots entries + locale 双订阅）。
  let tabsVersion = -1
  let tabsRevision = -1
  let tabs: { id: string; order: number; label: string }[] = []
  const sectionInjected = () => ({
    hooks: {
      tabs: {
        getSnapshot: () => {
          const version = ctx.slots.getVersion(TAB_SLOT)
          const revision = ctx.locale.getSnapshot().revision
          if (version !== tabsVersion || revision !== tabsRevision) {
            tabsVersion = version
            tabsRevision = revision
            tabs = ctx.slots.entries(TAB_SLOT).map((entry: { options: { id?: string; order?: number; label?: string | (() => string) } }) => ({
              id: entry.options.id ?? '',
              order: entry.options.order ?? 0,
              label: resolveSlotLabel(entry.options.label) ?? '',
            })).sort((a, b) => a.order - b.order)
          }
          return tabs
        },
        subscribe: (listener: () => void) => {
          const offLedger = ctx.slots.subscribe(TAB_SLOT, listener)
          const offLocale = ctx.locale.subscribe(listener)
          return () => {
            offLedger()
            offLocale()
          }
        },
      },
    },
  })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'third-party',
    order: 50,
    label: () => t('nav'),
    locale: NS,
    inject: sectionInjected as unknown as undefined,
    children: {
      [TAB_SLOT]: {
        kind: 'list',
        scope: 'root',
      },
    },
  }, ThirdPartySection as never))
}

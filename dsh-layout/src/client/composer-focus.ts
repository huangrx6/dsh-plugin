/**
 * Composer focus guard. The native app auto-focuses the conversation
 * input whenever a session opens, which summons the virtual keyboard on
 * touch devices before the user asked for it — "进入会话输入框直接弹
 * 出来，只有我触发键盘时才调起".
 *
 * A focus counts as user-driven only when a pointer / touch / key
 * gesture landed within the last GESTURE_WINDOW_MS: tapping the input
 * or Tab-ing into it arrives with (or right after) such a gesture,
 * while programmatic .focus() from a mount effect never does and is
 * blurred straight away. Scoped to coarse pointers (phones, tablets):
 * desktop auto-focus is harmless, often wanted, and summons no
 * keyboard.
 */
const COMPOSER_TEXT = '[data-dsh-layout-composer-text]'
const COMPOSER_SLOT = '[data-slot^="conversation.composer"]'
const EDITABLE = 'textarea, [contenteditable="true"], [contenteditable=""]'
const GESTURE_WINDOW_MS = 350

export class ComposerFocusGuard {
  constructor(private readonly doc: Document) {}

  install(): () => void {
    const view = this.doc.defaultView
    if (
      view === null ||
      view === undefined ||
      typeof view.matchMedia !== 'function' ||
      view.matchMedia('(pointer: coarse)').matches !== true
    ) {
      return () => {}
    }

    let lastGesture = 0
    const markGesture = (): void => {
      lastGesture = Date.now()
    }
    const onFocusIn = (event: Event): void => {
      const target = event.target
      if (!(target instanceof view.HTMLElement)) return
      if (!target.matches(EDITABLE)) return
      // Only the conversation composer, never dialogs or search boxes.
      if (
        target.closest(COMPOSER_TEXT) === null &&
        target.closest(COMPOSER_SLOT) === null
      ) {
        return
      }
      if (Date.now() - lastGesture <= GESTURE_WINDOW_MS) return
      // Programmatic focus: give it back before the keyboard comes up.
      target.blur()
    }

    this.doc.addEventListener('pointerdown', markGesture, true)
    this.doc.addEventListener('keydown', markGesture, true)
    this.doc.addEventListener('focusin', onFocusIn, true)
    return () => {
      this.doc.removeEventListener('pointerdown', markGesture, true)
      this.doc.removeEventListener('keydown', markGesture, true)
      this.doc.removeEventListener('focusin', onFocusIn, true)
    }
  }
}

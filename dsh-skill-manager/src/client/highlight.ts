/**
 * Syntax highlighting service for the file preview, built on Shiki's
 * fine-grained API: only the grammars below are bundled (not the 720-language
 * full bundle) and the pure-JavaScript regex engine avoids the wasm payload.
 * Both GitHub themes are compiled into one pass as CSS variables, so the
 * card flips between light / dark without re-highlighting.
 */
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import bash from 'shiki/langs/bash.mjs'
import c from 'shiki/langs/c.mjs'
import cpp from 'shiki/langs/cpp.mjs'
import css from 'shiki/langs/css.mjs'
import csvGrammar from 'shiki/langs/csv.mjs'
import diff from 'shiki/langs/diff.mjs'
import dockerfile from 'shiki/langs/dockerfile.mjs'
import go from 'shiki/langs/go.mjs'
import html from 'shiki/langs/html.mjs'
import ini from 'shiki/langs/ini.mjs'
import java from 'shiki/langs/java.mjs'
import javascript from 'shiki/langs/javascript.mjs'
import json from 'shiki/langs/json.mjs'
import lua from 'shiki/langs/lua.mjs'
import makefile from 'shiki/langs/makefile.mjs'
import markdown from 'shiki/langs/markdown.mjs'
import php from 'shiki/langs/php.mjs'
import python from 'shiki/langs/python.mjs'
import r from 'shiki/langs/r.mjs'
import ruby from 'shiki/langs/ruby.mjs'
import rust from 'shiki/langs/rust.mjs'
import sql from 'shiki/langs/sql.mjs'
import swift from 'shiki/langs/swift.mjs'
import toml from 'shiki/langs/toml.mjs'
import tsx from 'shiki/langs/tsx.mjs'
import typescript from 'shiki/langs/typescript.mjs'
import xml from 'shiki/langs/xml.mjs'
import yaml from 'shiki/langs/yaml.mjs'
import githubDark from 'shiki/themes/github-dark.mjs'
import githubLight from 'shiki/themes/github-light.mjs'

let highlighterPromise: Promise<HighlighterCore> | undefined

function getHighlighter(): Promise<HighlighterCore> {
  highlighterPromise ??= createHighlighterCore({
    themes: [githubLight, githubDark],
    langs: [
      bash, c, cpp, css, csvGrammar, diff, dockerfile, go, html, ini, java,
      javascript, json, lua, makefile, markdown, php, python, r, ruby, rust,
      sql, swift, toml, tsx, typescript, xml, yaml,
    ],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  }).catch(error => {
    highlighterPromise = undefined
    throw error
  })
  return highlighterPromise
}

const CACHE_LIMIT = 32
const cache = new Map<string, string>()

/** Highlights `code` and returns Shiki's `<pre>` HTML; unknown ids fall back to plain text. */
export async function highlightCode(code: string, language: string): Promise<string> {
  const key = `${language}\u0000${code.length}\u0000${code.slice(0, 4096)}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached
  const highlighter = await getHighlighter()
  const resolved = highlighter.getLoadedLanguages().includes(language) ? language : 'text'
  const html = highlighter.codeToHtml(code, { lang: resolved, themes: { light: 'github-light', dark: 'github-dark' } })
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(key, html)
  return html
}

/**
 * TailRunner 适配器 —— `tailscale` CLI 的真实执行边界。
 *
 * 领域层（tailscale.ts）通过注入的 {@link TailRunner} 端口访问外部
 * 世界，本文件是该端口的唯一生产实现；测试注入 fake runner 即可
 * 覆盖全部流程，无需真实 tailscale（Ports & Adapters）。
 */
import { spawn } from 'node:child_process'
import type { TailRunner } from './tailscale.ts'

/** 单条 tailscale 命令的默认超时；enable 的大多数场景远小于此。 */
const DEFAULT_TIMEOUT_MS = 25_000

interface RunOutput {
  stdout: string
  stderr: string
  code: number
}

/**
 * 生产 runner：`tailscale <args>`，捕获输出，超时 SIGKILL。
 *
 * 设计要点：
 *  - `stdio: ['ignore','pipe','pipe']` —— 子进程永不继承终端，避免在
 *    dsh 宿主进程的 TTY 上打字或弹任何东西；
 *  - 超时后 reject 而非 resolve —— 调用方（领域层）把「超时」与
 *    「非零退出」都视为可诊断失败，不会误判为成功；
 *  - `error` 事件（最典型是 ENOENT：tailscale 未安装）同样 reject，
 *    由 {@link ./tailscale.ts checkInstalled} 的 catch 归一化为
 *    `installed: false`。
 */
export const runTailscale: TailRunner = (args, opts) => {
  return new Promise<RunOutput>((resolve, reject) => {
    const child = spawn('tailscale', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout: string[] = []
    const stderr: string[] = []
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error(`tailscale ${args.join(' ')} 超时`))
    }, opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => { stdout.push(chunk.toString('utf8')) })
    child.stderr.on('data', (chunk: Buffer) => { stderr.push(chunk.toString('utf8')) })
    child.on('error', (error) => { clearTimeout(timer); reject(error) })
    child.on('close', (code) => {
      clearTimeout(timer)
      resolve({ stdout: stdout.join(''), stderr: stderr.join(''), code: code ?? -1 })
    })
  })
}

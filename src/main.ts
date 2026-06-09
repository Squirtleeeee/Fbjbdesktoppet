import { Pet } from './pet/pet'
import { SpeechBubble } from './ui/speech-bubble'
import { TokenBar } from './ui/token-bar'
import { WorkflowPanel } from './ui/workflow-panel'
import { StateReceiver } from './data/state-receiver'
import { TokenTracker } from './data/token-tracker'

async function main() {
  const appEl = document.getElementById('app')!

  // ──── 右键菜单 ────
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    window.petAPI?.showContextMenu()
  })

  // ──── Pet ────
  const pet = new Pet(appEl)

  // UI 组件
  const speechBubble = new SpeechBubble(appEl)
  const tokenBar = new TokenBar(appEl)
  const workflowPanel = new WorkflowPanel(appEl)

  // 默认隐藏 → 通过右键菜单打开
  tokenBar.hide()
  workflowPanel.hide()

  pet.setSpeechBubble(speechBubble)
  pet.setTokenBar(tokenBar)
  pet.setWorkflowPanel(workflowPanel)

  // ──── 数据层 ────
  const stateReceiver = new StateReceiver()
  const tokenTracker = new TokenTracker()

  stateReceiver.onStateChange((state) => {
    pet.setState(state)
  })

  stateReceiver.onTokenUpdate((tokens) => {
    tokenTracker.add(tokens.input, tokens.output, tokens.cacheRead, tokens.cacheCreate)
    const stats = tokenTracker.getStats()
    tokenBar.update({
      input: stats.input,
      output: stats.output,
      cacheRead: stats.cacheRead,
      cacheCreate: stats.cacheCreate,
      total: stats.total,
    })
  })

  stateReceiver.onWorkflowUpdate((steps) => {
    workflowPanel.update(steps)
  })

  // ──── 菜单动作 ────
  let tokenVisible = false
  let workflowVisible = false

  window.petAPI.onMenuAction((action: string) => {
    switch (action) {
      case 'toggle-token':
        tokenVisible = !tokenVisible
        tokenVisible ? tokenBar.show() : tokenBar.hide()
        break
      case 'toggle-workflow':
        workflowVisible = !workflowVisible
        workflowVisible ? workflowPanel.show() : workflowPanel.hide()
        break
      case 'scale-0.5': pet.getRenderer().setScale(0.5); break
      case 'scale-1': pet.getRenderer().setScale(1); break
      case 'scale-2': pet.getRenderer().setScale(2); break
      case 'scale-3': pet.getRenderer().setScale(3); break
    }
  })

  // ──── 启动 ────
  await pet.init()

  tokenTracker.resetIfNewDay()
  const stats = tokenTracker.getStats()
  tokenBar.update({
    input: stats.input,
    output: stats.output,
    cacheRead: stats.cacheRead,
    cacheCreate: stats.cacheCreate,
    total: stats.total,
  })

  speechBubble.showForState('idle')
  stateReceiver.start()

  try {
    const scale = await window.petAPI.getScale()
    pet.getRenderer().setScale(scale)
  } catch { /* not ready */ }
}

main().catch(console.error)

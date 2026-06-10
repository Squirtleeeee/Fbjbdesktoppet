import { Pet } from './pet/pet'
import { SpeechBubble } from './ui/speech-bubble'
import { WorkflowPanel } from './ui/workflow-panel'
import { StateReceiver } from './data/state-receiver'
import { TokenTracker } from './data/token-tracker'

async function main() {
  const appEl = document.getElementById('app')!

  // 右键菜单 (no-drag 区域才可以触发)
  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    window.petAPI?.showContextMenu()
  })

  // ──── Pet ────
  const pet = new Pet(appEl)

  // UI 组件
  const speechBubble = new SpeechBubble(appEl)
  const workflowPanel = new WorkflowPanel(appEl)

  workflowPanel.hide()

  pet.setSpeechBubble(speechBubble)
  pet.setWorkflowPanel(workflowPanel)

  // ──── 数据层 ────
  const stateReceiver = new StateReceiver()
  const tokenTracker = new TokenTracker()

  stateReceiver.onStateChange((state) => {
    pet.setState(state)
  })

  stateReceiver.onTokenUpdate((tokens) => {
    tokenTracker.addConversation(tokens.input, tokens.output, tokens.cacheRead, tokens.cacheCreate)
  })

  stateReceiver.onWorkflowUpdate((steps) => {
    workflowPanel.update(steps)
  })

  // ──── 菜单动作 ────
  let workflowVisible = false

  window.petAPI.onMenuAction((action: string) => {
    switch (action) {
      case 'toggle-workflow':
        workflowVisible = !workflowVisible
        workflowVisible ? workflowPanel.show() : workflowPanel.hide()
        break
      case 'request-token-data':
        window.petAPI?.sendTokenData(tokenTracker.getAllStats())
        break
      case 'scale-0.5': pet.getRenderer().setScale(0.5); window.petAPI?.saveScale(0.5); break
      case 'scale-1': pet.getRenderer().setScale(1); window.petAPI?.saveScale(1); break
      case 'scale-2': pet.getRenderer().setScale(2); window.petAPI?.saveScale(2); break
      case 'scale-3': pet.getRenderer().setScale(3); window.petAPI?.saveScale(3); break
    }
  })

  // ──── 交互 ────
  // 左键小狗 → 主进程拖拽
  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    if (!pet.getRenderer().hitTest(e.clientX, e.clientY)) return
    window.petAPI?.startDrag()
  })

  document.addEventListener('mouseup', () => {
    window.petAPI?.stopDrag()
  })

  // 滚轮缩放（仅在小狗身上，忽略微小滚动）
  document.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 5) return // 防误触
    const renderer = pet.getRenderer()
    if (!renderer.hitTest(e.clientX, e.clientY)) return
    e.preventDefault()
    const newScale = Math.max(0.3, Math.min(3, renderer.getScale() - e.deltaY * 0.002))
    renderer.setScale(newScale)
    window.petAPI?.saveScale(newScale)
  }, { passive: false })

  // ──── 启动 ────
  await pet.init()

  speechBubble.showForState('idle')
  stateReceiver.start()

  try {
    const scale = await window.petAPI.getScale()
    pet.getRenderer().setScale(scale)
  } catch { /* not ready */ }
}

// 导出供 token popup 使用
export {}

main().catch(console.error)

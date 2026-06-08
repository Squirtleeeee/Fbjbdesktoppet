import { Pet } from './pet/pet'
import { SpeechBubble } from './ui/speech-bubble'
import { TokenBar } from './ui/token-bar'
import { WorkflowPanel } from './ui/workflow-panel'
import { StateReceiver } from './data/state-receiver'
import { TokenTracker } from './data/token-tracker'

async function main() {
  const appEl = document.getElementById('app')!
  appEl.classList.add('draggable')

  // 初始化 Pet
  const pet = new Pet(appEl)

  // UI 组件
  const speechBubble = new SpeechBubble(appEl)
  const tokenBar = new TokenBar(appEl)
  const workflowPanel = new WorkflowPanel(appEl)

  pet.setSpeechBubble(speechBubble)
  pet.setTokenBar(tokenBar)
  pet.setWorkflowPanel(workflowPanel)

  // 数据层
  const stateReceiver = new StateReceiver()
  const tokenTracker = new TokenTracker()

  // 监听状态变化
  stateReceiver.onStateChange((state) => {
    pet.setState(state)
  })

  // 监听 Token 更新
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

  // 监听工作流更新
  stateReceiver.onWorkflowUpdate((steps) => {
    workflowPanel.update(steps)
  })

  // 加载精灵 + 启动渲染
  await pet.init()

  // 检查是否新的一天，重置统计
  tokenTracker.resetIfNewDay()
  const stats = tokenTracker.getStats()
  tokenBar.update({
    input: stats.input,
    output: stats.output,
    cacheRead: stats.cacheRead,
    cacheCreate: stats.cacheCreate,
    total: stats.total,
  })

  // 显示初始气泡
  speechBubble.showForState('idle')

  // 注册 WS 事件监听
  stateReceiver.start()

  // 获取初始缩放
  try {
    const scale = await window.petAPI.getScale()
    pet.getRenderer().setScale(scale)
  } catch { /* main process not ready yet */ }

  // 监听缩放变化
  if (window.petAPI) {
    window.petAPI.onEvent((event: any) => {
      if (event.type === 'scale_changed') {
        pet.getRenderer().setScale((event as any).scale)
      }
    })
  }
}

main().catch(console.error)

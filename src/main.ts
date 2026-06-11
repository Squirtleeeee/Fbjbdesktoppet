import { Pet } from './pet/pet'
import { SpeechBubble } from './ui/speech-bubble'
import { WorkflowPanel } from './ui/workflow-panel'
import { StateReceiver } from './data/state-receiver'
import { TokenTracker } from './data/token-tracker'

const IDLE_TIMEOUT_MS = 45_000

async function main() {
  const appEl = document.getElementById('app')!

  window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    window.petAPI?.showContextMenu()
  })

  const pet = new Pet(appEl)
  const speechBubble = new SpeechBubble(appEl)
  const workflowPanel = new WorkflowPanel(appEl)

  workflowPanel.hide()

  pet.setSpeechBubble(speechBubble)

  const getPetRect = () => pet.getRenderer().getSpriteRect()
  workflowPanel.setPetRectProvider(getPetRect)
  speechBubble.setPetRectProvider(getPetRect)

  const stateReceiver = new StateReceiver()
  const tokenTracker = new TokenTracker()

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  function pushTokenStats(): void {
    window.petAPI?.sendTokenData(tokenTracker.getAllStats())
  }

  function resetIdleTimer(): void {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      const state = pet.getState()
      if (state === 'working' || state === 'thinking') {
        pet.setState('idle')
      }
    }, IDLE_TIMEOUT_MS)
  }

  stateReceiver.onActivity(() => resetIdleTimer())

  stateReceiver.onStateChange((state) => {
    pet.setState(state)
    resetIdleTimer()
  })

  stateReceiver.onSessionStart(() => {
    tokenTracker.beginSession()
    workflowPanel.update([])
    workflowPanel.hide()
  })

  stateReceiver.onTokenUpdate((tokens) => {
    tokenTracker.updateFromTranscript(
      tokens.input,
      tokens.output,
      tokens.cacheRead,
      tokens.cacheCreate,
      tokens.projectKey || 'default',
      tokens.transcriptKey || '',
      tokens.source === 'cursor' ? 'cursor' : 'claude-code',
    )
    if (tokens.finalize) {
      tokenTracker.finalizeConversation()
    }
    pushTokenStats()
  })

  stateReceiver.onWorkflowUpdate((steps, currentIndex) => {
    workflowPanel.update(steps, currentIndex)
    if (steps.length > 0) {
      workflowPanel.show()
    }
  })

  function relayoutWorkflow(): void {
    if (workflowPanel.isVisible()) workflowPanel.layout()
  }

  window.petAPI.onMenuAction((action: string) => {
    switch (action) {
      case 'show-workflow':
      case 'toggle-workflow':
        workflowPanel.toggle()
        break
      case 'request-token-data':
        pushTokenStats()
        break
      case 'scale-0.5': pet.getRenderer().setScale(0.5); window.petAPI?.saveScale(0.5); relayoutWorkflow(); break
      case 'scale-1': pet.getRenderer().setScale(1); window.petAPI?.saveScale(1); relayoutWorkflow(); break
      case 'scale-2': pet.getRenderer().setScale(2); window.petAPI?.saveScale(2); relayoutWorkflow(); break
      case 'scale-3': pet.getRenderer().setScale(3); window.petAPI?.saveScale(3); relayoutWorkflow(); break
    }
  })

  let overPet = false

  document.addEventListener('mousemove', (e) => {
    const hit = pet.getRenderer().hitTest(e.clientX, e.clientY)
    if (hit !== overPet) {
      overPet = hit
      window.petAPI?.setMouseEvents(!hit)
    }
  })

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return
    if (!pet.getRenderer().hitTest(e.clientX, e.clientY)) return
    window.petAPI?.startDrag()
  })

  document.addEventListener('mouseup', () => {
    window.petAPI?.stopDrag()
  })

  document.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) < 5) return
    if (!pet.getRenderer().hitTest(e.clientX, e.clientY)) return
    e.preventDefault()
    const newScale = Math.max(0.3, Math.min(3, pet.getRenderer().getScale() - e.deltaY * 0.002))
    pet.getRenderer().setScale(newScale)
    window.petAPI?.saveScale(newScale)
    relayoutWorkflow()
  }, { passive: false })

  new ResizeObserver(() => relayoutWorkflow()).observe(appEl)

  await pet.init()

  window.petAPI?.setMouseEvents(true)
  speechBubble.showForState('idle')
  stateReceiver.start()
  resetIdleTimer()

  try {
    const scale = await window.petAPI.getScale()
    pet.getRenderer().setScale(scale)
    relayoutWorkflow()
  } catch { /* not ready */ }
}

export {}

main().catch(console.error)

import type { PetState } from '../engine/state-machine'

// 每个状态的随机短语池
const PHRASES: Record<PetState, string[]> = {
  idle: [
    '菲比~ 今天也要加油啾！',
    '啾... 菲比在等你哦~',
    '菲比在这里！随时待命~',
    '呼啾... 好安静呢',
    '菲比闲得开始数云朵了，啾~',
    '主人什么时候给菲比任务呢？',
  ],
  thinking: [
    '让菲比想想... 啾~ 🤔',
    '菲比正在思考中，啾啾！',
    '唔... 这个问题... 菲比需要认真想想',
    '菲比的脑细胞在燃烧！啾~',
    '等等，菲比有个想法...',
    '思考中的菲比最迷人，啾！',
  ],
  working: [
    '菲比在工作！不要打扰啾~',
    '交给我吧，菲比会搞定的！',
    '菲比正在努力... 啾啾啾！',
    '工作模式启动，菲比出击！',
    '菲比不会让你失望的~ 啾！',
    '埋头苦干中... 菲比加油！',
  ],
  done: [
    '菲比搞定啦！啾啾~ 🎉',
    '任务完成！菲比厉害吧？',
    '大功告成，菲比要奖励~ 啾！',
    '又完成一项，菲比真棒！✨',
    '菲比不负使命！啾~',
  ],
  waiting_auth: [
    '菲比需要你的帮助... 啾',
    '帮菲比确认一下嘛~',
    '菲比在等待授权... 啾啾',
    '主人！菲比需要你的决定~',
    '这个问题菲比自己搞不定... 啾',
  ],
}

export function getRandomPhrase(state: PetState): string {
  const pool = PHRASES[state]
  return pool[Math.floor(Math.random() * pool.length)]
}

// 自然插入口癖 — 供自定义消息使用
export function addVerbalTic(text: string): string {
  // 如果已经包含口癖词，直接返回
  if (/菲比|啾/.test(text)) return text

  const endings = ['菲比~', '啾！', '菲比啾比~']
  const ending = endings[Math.floor(Math.random() * endings.length)]
  return `${text}，${ending}`
}

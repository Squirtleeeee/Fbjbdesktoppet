import type { PetState } from '../engine/state-machine'

const PHRASES: Record<PetState, string[]> = {
  idle: [
    '汪~ 今天也要加油！',
    '汪... 我在等你哦~',
    '随时待命！汪！',
    '呼... 好安静呢',
    '汪，有点无聊了...',
    '什么时候给我任务呢？汪~',
  ],
  thinking: [
    '让我想想... 汪~ 🤔',
    '正在思考中，汪汪！',
    '唔... 这个问题... 需要认真想想',
    '脑细胞在燃烧！汪~',
    '等等，我有个想法... 汪！',
    '思考中，勿扰~ 汪',
  ],
  working: [
    '工作中！不要打扰汪~',
    '交给我吧，会搞定的！汪汪！',
    '正在努力... 汪汪汪！',
    '工作模式启动，出击！汪！',
    '不会让你失望的~ 汪！',
    '埋头苦干中... 加油汪！',
  ],
  done: [
    '搞定啦！汪汪~ 🎉',
    '任务完成！厉害吧？汪！',
    '大功告成，要奖励~ 汪！',
    '又完成一项，真棒！✨汪',
    '不负使命！汪~',
  ],
  waiting_auth: [
    '需要你的帮助... 汪',
    '帮我确认一下嘛~ 汪！',
    '在等待授权... 汪汪',
    '主人！需要你的决定~ 汪',
    '这个问题我自己搞不定... 汪',
  ],
}

export function getRandomPhrase(state: PetState): string {
  const pool = PHRASES[state]
  return pool[Math.floor(Math.random() * pool.length)]
}

import type { PetState } from '../engine/state-machine'

const PHRASES: Record<PetState, string[]> = {
  idle: [
    '菲比啾比~ 今天也要加油哦！',
    '菲比在等你哦，菲比啾比~',
    '随时待命！菲比啾比！',
    '好安静呢… 菲比啾比',
    '什么时候给菲比任务呢？菲比啾比~',
  ],
  thinking: [
    '让菲比想想… 菲比啾比 🤔',
    '唔，这个问题… 菲比啾比~',
    '思考中，菲比啾比勿扰~',
    '脑细胞在燃烧！菲比啾比~',
    '等等，菲比有个想法！菲比啾比！',
  ],
  working: [
    '菲比啾比！菲比工作中~',
    '交给菲比吧，菲比啾比！',
    '哒哒哒，菲比敲键盘中，菲比啾比~',
    '正在努力写代码，菲比啾比！',
    '专注模式启动，菲比啾比！',
  ],
  done: [
    '搞定啦！菲比啾比~ 🎉',
    '任务完成！菲比厉害吧？菲比啾比~',
    '大功告成，菲比要奖励，菲比啾比~',
    '又完成一项！菲比啾比 ✨',
    '不负使命！菲比啾比~',
  ],
  waiting_auth: [
    '需要你的确认… 菲比啾比',
    '帮菲比确认一下嘛，菲比啾比~',
    '在等待授权哦，菲比啾比~',
    '主人！菲比需要你决定，菲比啾比~',
    '这个菲比定不了… 菲比啾比~',
  ],
}

export function getRandomPhrase(state: PetState): string {
  const pool = PHRASES[state]
  let phrase = pool[Math.floor(Math.random() * pool.length)]
  if (!phrase.includes('菲比啾比')) {
    phrase = phrase.replace(/[。！~…]?$/, '') + '，菲比啾比~'
  }
  return phrase
}

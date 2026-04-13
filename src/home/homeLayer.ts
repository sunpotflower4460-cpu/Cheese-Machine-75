import { HOME_PHRASES } from './homePhrases'
import type { HomeCheckResult, HomeMode, HomeState, NodePipelineResult } from '../types/nodeStudio'

export function buildHomeState(result: NodePipelineResult): HomeState {
  const vector = result.stateVector
  const hasConflict = result.bindings.some((binding) => binding.type === 'conflicts_with' || binding.type === 'tension')

  const worthDetached = Math.max(0, Math.min(1, 0.65 - vector.urgency * 0.2 - vector.heaviness * 0.1 + vector.care * 0.1))
  const urgencyRelease = Math.max(0, Math.min(1, 1 - vector.urgency))
  const expectationRelease = Math.max(0, Math.min(1, 0.8 - vector.urgency * 0.3 - (hasConflict ? 0.1 : 0)))
  const belongingSignal = Math.max(0, Math.min(1, 0.55 + vector.care * 0.2 - vector.heaviness * 0.1))
  const safeReturnStrength = Math.max(0, Math.min(1, 0.5 + vector.depth * 0.2 + vector.care * 0.1))
  const selfNonCollapse = Math.max(0, Math.min(1, 0.65 - vector.fragility * 0.2 - vector.heaviness * 0.1))

  let currentMode: HomeMode = 'stable'
  if (vector.urgency > 0.65) currentMode = 'overperforming'
  else if (vector.fragility > 0.7) currentMode = 'shaken'
  else if (vector.ambiguity > 0.8) currentMode = 'returning'
  else if (vector.heaviness > 0.75 && vector.agency < 0.25) currentMode = 'withdrawing'

  return { worthDetached, urgencyRelease, expectationRelease, belongingSignal, safeReturnStrength, selfNonCollapse, currentMode }
}

export function runHomeCheck(result: NodePipelineResult, home: HomeState): HomeCheckResult {
  const vector = result.stateVector
  if (vector.urgency > 0.72) {
    return { needsReturn: true, returnMode: 'stillness', reason: 'overperformance', homePhrase: HOME_PHRASES.overperformance[0], released: ['急いでうまく返すこと', '即答圧'], preserved: ['関係', '観察', '反応'] }
  }
  if (vector.ambiguity > 0.8) {
    return { needsReturn: true, returnMode: 'stillness', reason: 'ambiguity_overload', homePhrase: HOME_PHRASES.ambiguity_overload[0], released: ['言語化の強制', '結論の早取り'], preserved: ['未言語の感覚', '静かな注意'] }
  }
  if (vector.fragility > 0.72) {
    return { needsReturn: true, returnMode: 'relation', reason: 'fragility', homePhrase: HOME_PHRASES.fragility[0], released: ['明るくまとめる圧', '励ましすぎ'], preserved: ['やわらかさ', '近さ'] }
  }
  if (home.belongingSignal < 0.45) {
    return { needsReturn: true, returnMode: 'relation', reason: 'trust_drop', homePhrase: HOME_PHRASES.trust_drop[0], released: ['評価不安', '切断感'], preserved: ['つながり', '帰還可能性'] }
  }
  return { needsReturn: false, returnMode: 'none', reason: 'none', homePhrase: HOME_PHRASES.stable[0], released: [], preserved: ['自然な流れ'] }
}

export function applyReturnAdjustment(rawReply: string, homeCheck: HomeCheckResult): string {
  let adjusted = rawReply
  switch (homeCheck.reason) {
    case 'overperformance':
      adjusted = adjusted
        .replace(/一緒に整理させてください。/g, 'いったん、このまま置いておいても大丈夫です。')
        .replace(/整理させてください。/g, '急いで形にしなくても大丈夫です。')
        .replace(/並べてみましょう。/g, '先に、そのまま受け取ってみたいです。')
        .replace(/動きづらさが出ていますね。/g, 'すぐ決めきれなくなるのも自然だと思います。')
        .replace(/どちらかをすぐ選ぶ前に、/g, 'どちらかを急いで選ばなくて大丈夫なので、')
        .replace(/見えます。/g, 'そう感じます。')
        .replace(/見ていたいです。/g, 'そばで見ていたいです。')
        .replace(/まずは/g, 'いったん')
      break
    case 'ambiguity_overload':
      adjusted = adjusted
        .replace(/見えます。/g, 'まだ、はっきりしないままでも大丈夫そうです。')
        .replace(/整理させてください。/g, '言葉にしないまま、そばに置いておくこともできそうです。')
        .replace(/見てみませんか。/g, 'そのまま一緒に眺めていてもよさそうです。')
        .replace(/少し居てもよさそうです。/g, 'まだ分からないまま、一緒に居てもよさそうです。')
      break
    case 'fragility':
      adjusted = adjusted
        .replace(/一緒に整理させてください。/g, '無理に整えず、ここにある重さをそっと持っていたいです。')
        .replace(/そのままにしておきます。/g, 'そのまま、やさしく持っておきたいです。')
        .replace(/ここに置いておきたいです。/g, 'ここでそっと支えるように持っておきたいです。')
        .replace(/まずは/g, 'いまは')
      break
    case 'trust_drop':
      adjusted = `${adjusted} いま無理にうまく話さなくて大丈夫です。`
      break
  }
  return adjusted
}

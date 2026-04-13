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
      adjusted = adjusted.replace(/整理させてください。/g, '少し見てみてもよさそうです。').replace(/並べてみましょう。/g, 'そのまま置いてみてもいいかもしれません。').replace(/見えます。/g, '見える気がします。')
      break
    case 'ambiguity_overload':
      adjusted = adjusted.replace(/見えます。/g, '見える気がします。').replace(/整理させてください。/g, '言葉にしないまま持っておくこともできそうです。')
      break
    case 'fragility':
      adjusted = adjusted.replace(/一緒に整理させてください。/g, '無理に整えず、ここにある感じを見てもよさそうです。').replace(/まずは/g, 'いまは')
      break
    case 'trust_drop':
      adjusted = `${adjusted} いま無理にうまく話さなくて大丈夫です。`
      break
  }
  return adjusted
}

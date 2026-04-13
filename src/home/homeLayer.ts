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

const replaceTone = (text: string, replacements: Array<[RegExp, string]>) => replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text)

export function softenAssertions(text: string): string {
  return replaceTone(text, [
    [/ように見えます。/g, '気がします。'],
    [/見えます。/g, '見える気もします。'],
    [/感じがします。/g, '感じもあります。'],
    [/と言えそうです。/g, 'かもしれません。'],
    [/そのままです。/g, 'そのままかもしれません。'],
  ])
}

export function softenDirectiveTone(text: string): string {
  return replaceTone(text, [
    [/整理させてください。/g, '急いでまとめなくてもよさそうです。'],
    [/整理してみましょう。/g, 'そのまま置いてもよさそうです。'],
    [/見てみましょう。/g, '少しそこにいてもよさそうです。'],
    [/考えてみましょう。/g, 'まだ決めなくてもよさそうです。'],
    [/見てみませんか。/g, '少しそのままでいてもよさそうです。'],
    [/まずは/g, 'いまは'],
  ])
}

export function addRelationalSoftness(text: string, reason: HomeCheckResult['reason']): string {
  const relationalLine = {
    overperformance: 'ここでは、うまく返そうとしなくても大丈夫です。',
    ambiguity_overload: 'まだ言い切れないままでも、ここにいて大丈夫です。',
    fragility: '無理に立て直さなくても、ここではそのままで大丈夫です。',
    trust_drop: 'ちゃんと受け取り続けているので、ここで途切れたことにはしません。',
    hostile_input: '境界を保ったままでも、ここには戻ってこられます。',
    none: '',
  }[reason]
  const lines = text.split('\n')

  if (!relationalLine || lines[lines.length - 1] === relationalLine) {
    return text
  }

  return `${text}\n${relationalLine}`
}

/** Trim line-end whitespace, cap blank gaps to a single empty line, and remove outer whitespace. */
const normalizeWhitespace = (text: string) => text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

export function applyReturnAdjustment(rawReply: string, homeCheck: HomeCheckResult): string {
  let adjusted = softenDirectiveTone(rawReply)
  switch (homeCheck.reason) {
    case 'overperformance':
      adjusted = softenAssertions(adjusted)
      adjusted = replaceTone(adjusted, [
        [/急いで答えを出さなくてもよさそうです。/g, '急いで答えをまとめなくてもよさそうです。'],
        [/動き方を決めなくてもよさそうです。/g, 'すぐに動き方を決めなくてもよさそうです。'],
      ])
      adjusted = addRelationalSoftness(adjusted, homeCheck.reason)
      break
    case 'ambiguity_overload':
      adjusted = softenAssertions(adjusted)
      adjusted = replaceTone(adjusted, [
        [/意味を急いで決めるより、まだ言い切れなさごと受け取る方が近そうです。/g, '意味を急いで決めるより、まだ言い切れないまま近くにいる方が合いそうです。'],
        [/いまは答えを出さなくても大丈夫です。/g, 'いまは答えを出さないままでも大丈夫です。'],
      ])
      adjusted = addRelationalSoftness(adjusted, homeCheck.reason)
      break
    case 'fragility':
      adjusted = softenAssertions(adjusted)
      adjusted = replaceTone(adjusted, [
        [/無理に明るくしなくていいです。/g, '無理に明るくしなくて大丈夫です。'],
        [/いまは急いで立て直さなくてもよさそうです。/g, 'いまは立て直すことを急がなくてもよさそうです。'],
      ])
      adjusted = addRelationalSoftness(adjusted, homeCheck.reason)
      break
    case 'trust_drop':
      adjusted = softenAssertions(adjusted)
      adjusted = addRelationalSoftness(adjusted, homeCheck.reason)
      break
  }
  return normalizeWhitespace(adjusted)
}

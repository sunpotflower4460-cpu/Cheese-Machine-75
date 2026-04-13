import { PATTERN_DICT, RELATION_DICT, NODE_DICT } from '../core/nodeData'
import { buildHomeState, runHomeCheck, applyReturnAdjustment } from '../home/homeLayer'
import type { Binding, CoreNode, HomeCheckResult, NodePipelineResult, ReturnTrace, StudioInternalProcess, StudioPattern, StudioViewModel } from '../types/nodeStudio'

export const generateRawReplyPreview = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  if (result.activatedNodes.length === 0) return 'なんだか、言葉になりにくい状態のようです。少し問いかけて対話の糸口を探してみます。'
  if (result.activatedNodes[0].id === 'processing') return 'はっきりとした言葉が見えないため、まずはそのまま受け止めて、あなたのペースに合わせます。'

  if (mainPattern?.id === 'motivation_drift') return 'なんだか、かなりしんどそうです。単なる迷いというより、疲れが溜まって動けなくなっている感じがします。まずは『何に消耗しているか』を置いてみてもよさそうです。'
  if (mainPattern?.id === 'core_insecurity') return '一時的な不安というより、深いところで自分を信じられなくなっている感じがします。今は急いで解決しようとせず、その重さをそのままにしておきます。'
  if (mainConflict && ['conflicts_with', 'tension'].includes(mainConflict.type)) return '二つの気持ちが同時に強くぶつかって、身動きが取れなくなっているようです。行動を急ぐ前に、この葛藤をそのままテーブルに置いてみてもいいかもしれません。'
  if (result.stateVector.ambiguity > 0.75) return 'まだ言葉になりきってない感じがありますね。無理に言葉を探したり結論を出そうとせず、その曖昧な感覚のまま少し留まってみましょう。'
  if (mainPattern) return `なんだか、${mainPattern.titleJa}のような状態が感じられます。今は無理に動くよりも、この状態がどこから来ているかを少し見てみませんか。`

  return 'なんだか、いろんな感情が混ざっているような感じがします。まずはその感覚を否定せずに受け止めたいと思います。'
}

export const getResponseMeta = (result: NodePipelineResult, mainConflict: Binding | null, homeCheck: HomeCheckResult) => {
  const vector = result.stateVector
  let temperature = '受容寄り'
  if (vector.ambiguity > 0.7) temperature = '未言語保持寄り'
  else if (mainConflict && ['conflicts_with', 'tension'].includes(mainConflict.type)) temperature = '葛藤可視化寄り'
  else if (vector.urgency > 0.6) temperature = '整理寄り'

  let withheld = '結論を急がなかった'
  if (homeCheck.needsReturn) withheld = homeCheck.released.join('・')
  else if (vector.fragility > 0.6) withheld = '背中を押しすぎなかった・明るくまとめすぎなかった'

  let wording = '状態をそのまま受け止める言葉を選んだ'
  if (homeCheck.needsReturn) wording = `${homeCheck.reason} を検知したため、断定や過剰整理を緩めた`
  else if (vector.fragility > 0.6) wording = 'fragility（繊細さ）が高いため、断定を避けた'
  else if (mainConflict) wording = 'conflict（葛藤）が強いため、片側に寄せず両方を見せた'

  const time = 1 + result.bindings.length * 0.15 + result.liftedPatterns.length * 0.2
  return { time: `約 ${time.toFixed(1)}s`, temperature, withheld, wording }
}

export const getReplyDirectionText = (result: NodePipelineResult, mainConflict: Binding | null) => {
  if (result.stateVector.ambiguity > 0.75) return '未言語の感覚を保つ返しにする'
  if (mainConflict && ['conflicts_with', 'tension'].includes(mainConflict.type)) return '葛藤の整理として返す'
  if (result.liftedPatterns.length > 0) return '構造的な状態への共感として返す'
  return '状態の受け止めとして返す'
}

export const getInternalProcess = (
  result: NodePipelineResult,
  mainNode: CoreNode | null,
  mainConflict: Binding | null,
  homeCheck: HomeCheckResult,
): StudioInternalProcess[] => {
  const vector = result.stateVector
  let field = '標準的な場'
  if (vector.heaviness > 0.6 && vector.ambiguity > 0.6) field = '重さと曖昧さが混ざり合った場'
  else if (vector.heaviness > 0.6) field = '重さのある場'
  else if (vector.ambiguity > 0.6) field = '曖昧さが高い場'
  else if (vector.fragility > 0.6) field = '繊細さの高い場'

  const reaction = mainNode && mainNode.id !== 'processing' ? `${mainNode.label} に強く触れた` : '全体像の把握から入った'
  let stance = '整理するより先に受け止める'
  if (mainConflict && ['conflicts_with', 'tension'].includes(mainConflict.type)) stance = '片方に寄らず葛藤を可視化する'
  if (vector.ambiguity > 0.7) stance = '未言語のまま保つ'

  const activated = result.activatedNodes.filter((node) => node.id !== 'processing').slice(0, 3).map((node) => node.label).join(', ') || '特になし'
  const conflictText = mainConflict ? `${mainConflict.source} ${RELATION_DICT[mainConflict.type]?.ja || mainConflict.type} ${mainConflict.target}` : '目立った衝突はない'

  const processes: StudioInternalProcess[] = [
    { label: 'Field', desc: 'この入力を受けたとき、場をどう感じたか', content: field, origin: '構造の要約' },
    { label: 'Reaction', desc: '最初に何に触れたか', content: reaction, origin: '自然反応' },
    { label: 'Stance', desc: 'どういう立ち方を選んだか', content: stance, origin: '姿勢選択' },
    { label: 'Activated meaning', desc: '何が意味の中心として浮上したか', content: activated, origin: '構造の要約' },
    { label: 'Conflict / Pull', desc: 'どこでぶつかり・引っ張りが起きたか', content: conflictText, origin: '自然反応' },
    { label: 'Home Check', desc: 'いったん戻る必要があるかを見た', content: homeCheck.needsReturn ? `${homeCheck.reason} を検出` : '過剰反応なしと判断', origin: '急がない判断' },
  ]

  if (homeCheck.needsReturn) {
    processes.push({ label: 'Return', desc: '返答前にどこへ戻ったか', content: `${homeCheck.returnMode} に戻した`, origin: '急がない判断' })
  }

  processes.push({ label: 'Crystallization', desc: 'その結果、どんな返答方向に結晶化したか', content: getReplyDirectionText(result, mainConflict), origin: '姿勢選択' })
  return processes
}

export const generateGuideObserves = (
  result: NodePipelineResult,
  mainPattern: StudioPattern | null,
  mainConflict: Binding | null,
  homeCheck: HomeCheckResult,
) => {
  if (result.activatedNodes.length === 0) return { summary: '入力がないため観測待機中です。', uncertainty: 'データがありません。', naturalnessAdvice: '' }
  if (result.activatedNodes[0].id === 'processing') {
    return {
      summary: '特定の強いノードが見当たらず、まずは全体を受け止めようとしています。一言でいうと、「静かに聞いている感じ」です。',
      uncertainty: '要素が少なすぎるため、背後の意味はまだ保留されています。',
      naturalnessAdvice: '過剰に分析せず、そのままの姿勢で正解です。',
    }
  }

  let summary = '結晶AIは、'
  if (mainPattern) summary += `${mainPattern.label}（${mainPattern.titleJa}）のパターンを中心に状況を見ています。一言でいうと、「${mainPattern.simpleDescJa}」という感じです。`
  else summary += '複数のノードの発火を同時に捉えようとしています。'

  if (mainConflict) summary += `特に ${mainConflict.source} と ${mainConflict.target} の間に見られる「${RELATION_DICT[mainConflict.type]?.ja || mainConflict.type}」の構造が、そのまま返答の姿勢に反映されています。`

  let uncertainty = ''
  if (result.stateVector.ambiguity > 0.7) uncertainty = 'ambiguity（曖昧さ）が非常に高いため、現時点では「何が本当の問題か」の特定を意図的に保留しています。一言でいうと、まだ言葉が追いついていない感じです。'
  else if (!mainPattern) uncertainty = 'relation がまだ少なく構造が薄いため、意味の断定を避けています。'
  else uncertainty = '他にも抑制されている感情がある可能性がありますが、まずは表面化した状態の扱いに集中しています。'

  let naturalnessAdvice = '反応を先に出してから意味を添えると、もっと自然です。'
  if (homeCheck.reason === 'overperformance') naturalnessAdvice = '少し頭で整えすぎています。先に“感じたこと”が出ると、もっと人っぽくなります。'
  else if (homeCheck.reason === 'ambiguity_overload') naturalnessAdvice = 'まだ整理しすぎています。ここは少し“分からないまま近くにいる”方が自然です。'
  else if (homeCheck.reason === 'fragility') naturalnessAdvice = 'この入力では、明るさを足すより重さをそのまま持つ方がしっくりきます。'
  else if (homeCheck.reason === 'trust_drop') naturalnessAdvice = '関係の再確認が必要です。正しい説明より、ここにいていいというシグナルが合っています。'
  else if (result.stateVector.ambiguity > 0.5) naturalnessAdvice = '今回は理解の速さより、言葉の遅さが合っています。'

  return { summary, uncertainty, naturalnessAdvice }
}

export const buildStudioViewModel = (result: NodePipelineResult): StudioViewModel => {
  const mainState = result.activatedNodes.length > 0 ? result.activatedNodes[0] : null
  const conflictRelations = result.bindings.filter((binding) => ['conflicts_with', 'tension'].includes(binding.type))
  const mainConflict = conflictRelations.length > 0 ? conflictRelations[0] : (result.bindings.length > 0 ? result.bindings[0] : null)
  const enrichedPatterns = result.liftedPatterns.map((pattern) => ({
    ...pattern,
    ...(PATTERN_DICT[pattern.label] || { titleJa: pattern.label, simpleDescJa: '説明がありません', internalDescription: '不明なパターン' }),
  }))
  const mainPattern = enrichedPatterns.length > 0 ? enrichedPatterns[0] : null

  const homeState = buildHomeState(result)
  const homeCheck = runHomeCheck(result, homeState)
  const rawReplyPreview = generateRawReplyPreview(result, mainPattern, mainConflict)
  const adjustedReplyPreview = applyReturnAdjustment(rawReplyPreview, homeCheck)
  const responseMeta = getResponseMeta(result, mainConflict, homeCheck)

  const returnTrace: ReturnTrace = {
    timestamp: new Date().toISOString(),
    trigger: homeCheck.reason,
    returnMode: homeCheck.returnMode,
    homePhrase: homeCheck.homePhrase,
    reason: homeCheck.reason,
    beforeTone: '整理寄り',
    afterTone: responseMeta.temperature,
  }

  let flowSummaryText = ''
  if (mainState && mainState.id !== 'processing') {
    flowSummaryText = `この入力では、まず ${mainState.label}（${NODE_DICT[mainState.label]?.ja || mainState.label}）に強く触れました。\n`
    if (mainConflict) flowSummaryText += `次に ${mainConflict.source} と ${mainConflict.target} のあいだの揺れを見ました。\n`
    else flowSummaryText += '目立った強い衝突は感じていません。\n'
    flowSummaryText += `そのため、行動を急がせるより先に、「${getReplyDirectionText(result, mainConflict)}」の方向に結晶化しました。`
  } else {
    flowSummaryText = '明確なキーワードの反応がなかったため、まずは静かに全体を受け止める姿勢をとりました。'
  }

  return {
    mainState,
    mainConflict,
    mainPattern,
    flowSummaryText,
    rawReplyPreview,
    adjustedReplyPreview,
    responseMeta,
    internalProcess: getInternalProcess(result, mainState, mainConflict, homeCheck),
    guideObserves: generateGuideObserves(result, mainPattern, mainConflict, homeCheck),
    enrichedPatterns,
    homeState,
    homeCheck,
    returnTrace,
  }
}

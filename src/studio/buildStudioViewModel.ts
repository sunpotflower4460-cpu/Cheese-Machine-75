import { PATTERN_DICT, RELATION_DICT, NODE_DICT } from '../core/nodeData'
import { buildHomeState, runHomeCheck, applyReturnAdjustment } from '../home/homeLayer'
import type { Binding, CoreNode, HomeCheckResult, NodePipelineResult, ReturnTrace, StudioInternalProcess, StudioPattern, StudioViewModel } from '../types/nodeStudio'

const CONFLICT_TYPES = ['conflicts_with', 'tension'] as const
const MAX_GUIDE_TAGS = 3
const AMBIGUITY_KEEP_STILL_THRESHOLD = 0.82
type ConflictType = (typeof CONFLICT_TYPES)[number]

const isConflictType = (type: string): type is ConflictType => CONFLICT_TYPES.some((conflictType) => conflictType === type)

const hasConflict = (mainConflict: Binding | null) => Boolean(mainConflict && isConflictType(mainConflict.type))

function cleanReplyParts(replyParts: Array<string | null | undefined>) {
  return replyParts.map((part) => part?.trim()).filter((part): part is string => Boolean(part))
}

const shouldOmitMeaningFollow = (result: NodePipelineResult) => result.stateVector.ambiguity > AMBIGUITY_KEEP_STILL_THRESHOLD && result.activatedNodes[0]?.id !== 'processing'

export const getReactionLead = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  const vector = result.stateVector

  if (result.activatedNodes.length === 0) return 'うまく言葉にならないまま来てくれた感じがあります。'
  if (result.activatedNodes[0].id === 'processing') return 'まだはっきりしないまま、ここにある感じがします。'
  if (mainPattern?.id === 'motivation_drift') return 'なんだか、かなりしんどそうです。'
  if (mainPattern?.id === 'career_anxiety') return '変わりたい気持ちと、怖さが同時に出ています。'
  if (mainPattern?.id === 'core_insecurity') return 'ずっと気を張ったまま、自分を信じにくくなっていそうです。'
  if (mainPattern?.id === 'unarticulated_feeling') return 'まだ言葉になる手前で、引っかかりだけが残っている感じがあります。'
  if (mainPattern?.id === 'quiet_plea') return 'ただ分かってほしい気持ちが、静かににじんでいます。'
  if (mainPattern?.id === 'fragile_optimism') return '少しだけ、前を向きたい感じも残っています。'
  if (hasConflict(mainConflict) && vector.fragility > 0.7) return '揺れたまま、かなり持ちこたえている感じがします。'
  if (hasConflict(mainConflict)) return '気持ちが両方に引っぱられている感じがあります。'
  if (vector.ambiguity > 0.75) return 'まだうまく言葉にならないままの感じがあります。'
  if (vector.fragility > 0.72) return '少し触れるだけでも揺れそうな感じがあります。'
  if (mainPattern) return `ふっと、${mainPattern.titleJa}に近い重さが出ています。`

  return 'いろんな感情が、まだひとつにまとまらないままある感じがします。'
}

export const getMeaningFollow = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  const vector = result.stateVector

  if (result.activatedNodes.length === 0) return '意味を急いでつけるより、そのままの感じに付き添う方が近そうです。'
  if (result.activatedNodes[0].id === 'processing') return vector.ambiguity > 0.7 ? 'いまは説明より、まだ分からなさが残っていること自体が大事そうです。' : '先に意味を決めるより、そのまま受け取る方が自然そうです。'
  if (mainPattern?.id === 'motivation_drift') return 'ただ迷っているというより、疲れたまま動こうとしている感じがします。'
  if (mainPattern?.id === 'career_anxiety') return '進みたい気持ちも止まりたい気持ちも、どちらも本音に見えます。'
  if (mainPattern?.id === 'core_insecurity') return '一時的な不安というより、深いところで自分に寄りかかれなくなっているのかもしれません。'
  if (mainPattern?.id === 'quiet_plea') return '解決より、ちゃんと受け取られることの方が近そうです。'
  if (mainPattern?.id === 'fragile_optimism') return 'まだ強い確信ではないけれど、その小さな明るさはちゃんとあります。'
  if (hasConflict(mainConflict)) return 'どちらかを選べないというより、どちらにも本音があるように見えます。'
  if (vector.ambiguity > 0.75) return '意味を急いで決めるより、まだ言い切れなさごと受け取る方が近そうです。'
  if (vector.fragility > 0.72) return '整えるより先に、揺れやすさそのものをそのまま持っていた方が合いそうです。'
  if (mainPattern) return `${mainPattern.simpleDescJa}に近い空気があります。`

  return 'いまは理解を急ぐより、混ざったままの感じに触れている方が自然そうです。'
}

export const getClosingLine = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  const vector = result.stateVector

  if (result.activatedNodes.length === 0) return 'まだ分からないままでも、そのままで大丈夫です。'
  if (result.activatedNodes[0].id === 'processing') return 'いまは無理に言葉を探さなくても大丈夫です。'
  if (vector.ambiguity > 0.75) return 'いまは答えを出さなくても大丈夫です。'
  if (vector.fragility > 0.72) return 'いまは急いで立て直さなくてもよさそうです。'
  if (mainPattern?.id === 'quiet_plea') return 'ここで無理にうまく話し切らなくても大丈夫です。'
  if (mainPattern?.id === 'fragile_optimism') return '大きく決めなくても、その小さな明るさは消さなくてよさそうです。'
  if (hasConflict(mainConflict)) return 'いまは片方に寄せず、この揺れのままでいてよさそうです。'
  if (mainPattern?.id === 'motivation_drift') return 'いまは急いで動き方を決めなくてもよさそうです。'
  if (mainPattern?.id === 'core_insecurity') return 'ここで無理に立て直さなくてもよさそうです。'

  return '急いでうまく言い切らなくてもよさそうです。'
}

export const composeNaturalReply = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  const meaningFollow = getMeaningFollow(result, mainPattern, mainConflict)
  const closingLine = getClosingLine(result, mainPattern, mainConflict)

  return cleanReplyParts([
    getReactionLead(result, mainPattern, mainConflict),
    shouldOmitMeaningFollow(result) ? null : meaningFollow,
    closingLine === meaningFollow ? null : closingLine,
  ]).join('\n')
}

export const generateRawReplyPreview = (result: NodePipelineResult, mainPattern: StudioPattern | null, mainConflict: Binding | null) => {
  return composeNaturalReply(result, mainPattern, mainConflict)
}

export const getResponseMeta = (result: NodePipelineResult, mainConflict: Binding | null, homeCheck: HomeCheckResult) => {
  const vector = result.stateVector
  let temperature = '受容寄り'
  if (vector.ambiguity > 0.7) temperature = '未言語保持寄り'
  else if (hasConflict(mainConflict)) temperature = '葛藤同席寄り'
  else if (vector.urgency > 0.6) temperature = '静かな減速寄り'

  let withheld = '結論を急がなかった'
  if (homeCheck.needsReturn) withheld = homeCheck.released.join('・')
  else if (vector.fragility > 0.6) withheld = '背中を押しすぎなかった・明るくまとめすぎなかった'

  let wording = '反応を先に置いて、意味づけを絞った'
  if (homeCheck.needsReturn) wording = `${homeCheck.reason} を検知したため、断定や導きすぎを緩めた`
  else if (vector.fragility > 0.6) wording = 'fragility（繊細さ）が高いため、励ましより同席感を優先した'
  else if (mainConflict) wording = 'conflict（葛藤）が強いため、解説より揺れの同席を前に出した'

  const time = 1 + result.bindings.length * 0.15 + result.liftedPatterns.length * 0.2
  return { time: `約 ${time.toFixed(1)}s`, temperature, withheld, wording }
}

export const getReplyDirectionText = (result: NodePipelineResult, mainConflict: Binding | null) => {
  if (result.stateVector.ambiguity > 0.75) return '未言語の感覚を保つ返しにする'
  if (hasConflict(mainConflict)) return '葛藤に結論を出さず同席する'
  if (result.liftedPatterns.length > 0) return '構造より先に反応が立つ返しにする'
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
  if (mainConflict && isConflictType(mainConflict.type)) stance = '片方に寄らず葛藤を可視化する'
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
  if (result.activatedNodes.length === 0) {
    return {
      summary: '入力がないため観測待機中です。',
      uncertainty: 'データがありません。',
      naturalnessAdvice: '意味づけは足さず、まず来てくれた感じへの反応だけを短く置いてください。',
      tags: ['反応先行', '未言語保持'],
    }
  }
  if (result.activatedNodes[0].id === 'processing') {
    return {
      summary: '特定の強いノードが見当たらず、まずは全体を受け止めようとしています。一言でいうと、「静かに聞いている感じ」です。',
      uncertainty: '要素が少なすぎるため、背後の意味はまだ保留されています。',
      naturalnessAdvice: '説明を足すより、「まだはっきりしないね」のような反応で止めると自然です。',
      tags: ['反応先行', '未言語保持'],
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

  let naturalnessAdvice = '説明が先に立っています。最初の1文を“意味”ではなく“反応”にしてください。'
  const tags = ['反応先行']
  if (homeCheck.reason === 'overperformance') {
    naturalnessAdvice = '説明しすぎです。1文目は感じた反応だけにして、解決方向の言い回しを1段引いてください。'
    tags.push('導き弱め')
  } else if (homeCheck.reason === 'ambiguity_overload') {
    naturalnessAdvice = 'まだ断定が強いです。“〜かもしれない” を1段増やして、分からないまま近くにいる形にしてください。'
    tags.push('断定弱め', '未言語保持')
  } else if (homeCheck.reason === 'fragility') {
    naturalnessAdvice = 'この入力では励ましより同席感が合います。明るくまとめる着地を外して、重さをそのまま残してください。'
    tags.push('同席感', '圧を下げる')
  } else if (homeCheck.reason === 'trust_drop') {
    naturalnessAdvice = '硬さより関係の途切れていなさが必要です。最後に短く、受け取り続けている感じを足してください。'
    tags.push('関係維持')
  } else if (result.stateVector.ambiguity > 0.5) {
    naturalnessAdvice = '意味づけが少し早いです。2文目を短くして、“まだ言い切れない”余白を残してください。'
    tags.push('未言語保持')
  } else if (hasConflict(mainConflict)) {
    naturalnessAdvice = '解説が先に出ています。揺れている感じを1文目に置き、整理や結論は後ろへ下げてください。'
    tags.push('揺れを先に')
  } else {
    tags.push('断定弱め')
  }

  return { summary, uncertainty, naturalnessAdvice, tags: tags.slice(0, MAX_GUIDE_TAGS) }
}

export const buildStudioViewModel = (result: NodePipelineResult): StudioViewModel => {
  const mainState = result.activatedNodes.length > 0 ? result.activatedNodes[0] : null
  const conflictRelations = result.bindings.filter((binding) => isConflictType(binding.type))
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

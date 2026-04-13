export const CATEGORY_JA: Record<string, string> = { state: '状態', desire: '欲求', context: '文脈', need: '必要性', action: '行動', system: 'システム' }

export const NODE_DICT: Record<string, { ja: string; desc: string }> = {
  fatigue: { ja: '疲労感 / 消耗感', desc: '今回は「意欲が湧かない」「疲れた」の中心として出ています' },
  wanting_change: { ja: '変わりたい気持ち', desc: '今回は「今のままではいたくない」という方向で出ています' },
  routine: { ja: '日常の繰り返し', desc: '今回は「変わらない現状」の背景として出ています' },
  safety: { ja: '安全・安心への欲求', desc: '今回は「失敗したくない・とどまりたい」という引力として出ています' },
  self_doubt: { ja: '自己不信', desc: '今回は「自分を信じきれない」という感覚の中心として出ています' },
  leaving: { ja: '離れる行動', desc: '今回は「転職や現状打破」の具体行動として出ています' },
  anxiety: { ja: '不安感', desc: '今回は自信のなさから波及する揺れとして出ています' },
  chronicity: { ja: '時間的連続性', desc: '今回は「最近ずっと続いている」という重さとして出ています' },
  ambiguity: { ja: '曖昧さ', desc: '今回は「まだ言葉にできない感じ」の中心として出ています' },
  vague_discomfort: { ja: '漠然とした違和感', desc: '今回は「なんとなく引っかかる」という感覚として出ています' },
  loneliness: { ja: '寂しさ / 孤独感', desc: '今回は「本当は寂しい」という隠れた感情として出ています' },
  seeking_understanding: { ja: '理解への欲求', desc: '今回は「ただ分かってほしい」という願いとして出ています' },
  faint_hope: { ja: 'かすかな希望', desc: '今回は「少しだけ光がある」という状態として出ています' },
  processing: { ja: '処理中 / 傾聴', desc: '今回は特定の強い感情が見えないため、まず受け止める姿勢として出ています' },
  excitement: { ja: '高揚感 / ワクワク', desc: '今回は他の重い状態によって押さえ込まれています' },
  decisiveness: { ja: '決断力', desc: '今回は安全欲求と自己不信の挟み撃ちで出にくくなっています' },
  self_efficacy: { ja: '自己効力感', desc: '今回は自己不信によって完全に押さえ込まれています' },
  agency: { ja: '主体性', desc: '今回は不安や曖昧さによって低下させられています' },
  clarity: { ja: '明確さ', desc: '今回は曖昧さの強さによって完全に抑制されています' },
  articulation: { ja: '言語化', desc: '今回は「言葉にできない」という状態から明示的に止められています' },
  despair: { ja: '絶望', desc: '今回はかすかな希望によって押し返されています' },
}

export const RELATION_DICT: Record<string, { ja: string; desc: string }> = {
  conflicts_with: { ja: '〜と衝突', desc: '一言でいうと、「どっちも大事で決めきれない感じ」です' },
  tension: { ja: '〜との摩擦', desc: '一言でいうと、「まだ明確な対立ではないけれど落ち着かない感じ」です' },
  because_of: { ja: '〜によって強まる', desc: '一言でいうと、「背景にある条件がこの状態を押し上げている感じ」です' },
  amplified_by: { ja: '〜で増幅', desc: '一言でいうと、「もともとあった状態がさらに強くなっている感じ」です' },
  sustains: { ja: '〜を維持', desc: '一言でいうと、「その状態が続く土台になっている感じ」です' },
  counteracts: { ja: '〜を押し返す', desc: '一言でいうと、「ある感情を完全には消さず、弱めたり押し戻したりしている感じ」です' },
  drives: { ja: '〜を駆動', desc: '一言でいうと、「その感情が、行動や欲求の原動力になっている感じ」です' },
  uncovers: { ja: '〜を発見', desc: '一言でいうと、「行動や内省を通して、隠れていた感情が表に見えてくる感じ」です' },
}

export const PATTERN_DICT: Record<string, { titleJa: string; simpleDescJa: string; internalDescription: string }> = {
  motivation_drift: { titleJa: '意欲の流れ落ち', simpleDescJa: 'やる気がないというより、少しずつ流れが落ちている感じ', internalDescription: '意味の喪失を伴う停滞' },
  career_anxiety: { titleJa: 'キャリアの不安', simpleDescJa: '変わりたいけど怖い、という綱引き状態', internalDescription: '変化と安全のジレンマ' },
  core_insecurity: { titleJa: '根源的な自己不信', simpleDescJa: '一時的というより、深いところで自分を信じにくい感じ', internalDescription: '根源的な自己不信の継続' },
  unarticulated_feeling: { titleJa: '未言語化の感覚', simpleDescJa: '分かるけどまだ言葉にならない感じ', internalDescription: '未言語化の感覚の滞留' },
  quiet_plea: { titleJa: '静かな訴え', simpleDescJa: '強くは言えないけど分かってほしい感じ', internalDescription: '静かな理解への訴え' },
  fragile_optimism: { titleJa: '壊れやすい楽観', simpleDescJa: 'まだ確信はないけれど、少し前を向いている感じ', internalDescription: '壊れやすい楽観性の芽生え' },
}

export const CORE_NODES = [
  { id: 'fatigue', label: 'fatigue', category: 'state', keywords: ['意欲が湧かない', '疲', 'しんど', '消耗', 'やる気が出ない'] },
  { id: 'wanting_change', label: 'wanting_change', category: 'desire', keywords: ['転職', '変わりたい', '辞めたい', '違うこと'] },
  { id: 'routine', label: 'routine', category: 'context', keywords: ['毎日', 'ずっと', '繰り返し', '退屈'] },
  { id: 'safety', label: 'safety', category: 'need', keywords: ['悩んでいる', '不安', '失敗したくない', '安定'] },
  { id: 'self_doubt', label: 'self_doubt', category: 'state', keywords: ['信じきれない', '自信がない', '自分なんて', 'ダメ'] },
  { id: 'leaving', label: 'leaving', category: 'action', keywords: ['転職', '辞める', '離れる', '逃げる'] },
  { id: 'anxiety', label: 'anxiety', category: 'state', keywords: ['悩んで', '不安', '心配', '焦り'] },
  { id: 'chronicity', label: 'chronicity', category: 'context', keywords: ['最近ずっと', 'ずっと', '長年', '消えない'] },
  { id: 'ambiguity', label: 'ambiguity', category: 'state', keywords: ['言葉にできない', 'わからない', 'もやもや', '引っかかる'] },
  { id: 'vague_discomfort', label: 'vague_discomfort', category: 'state', keywords: ['なんとなく', '違和感', '引っかかる'] },
  { id: 'loneliness', label: 'loneliness', category: 'state', keywords: ['寂しい', '孤独', '独り'] },
  { id: 'seeking_understanding', label: 'seeking_understanding', category: 'desire', keywords: ['分かってほしい', '聞いてほしい', '理解'] },
  { id: 'faint_hope', label: 'faint_hope', category: 'state', keywords: ['希望', '少しだけ', '光', '気がする'] },
]

export const BINDING_RULES = [
  { source: 'fatigue', target: 'routine', type: 'because_of' },
  { source: 'wanting_change', target: 'safety', type: 'conflicts_with' },
  { source: 'leaving', target: 'safety', type: 'tension' },
  { source: 'self_doubt', target: 'chronicity', type: 'amplified_by' },
  { source: 'vague_discomfort', target: 'ambiguity', type: 'sustains' },
  { source: 'loneliness', target: 'seeking_understanding', type: 'drives' },
]

export const PATTERN_RULES = [
  { id: 'motivation_drift', reqNodes: ['fatigue', 'routine'] },
  { id: 'career_anxiety', reqNodes: ['wanting_change', 'safety'] },
  { id: 'core_insecurity', reqNodes: ['self_doubt', 'chronicity'] },
  { id: 'unarticulated_feeling', reqNodes: ['ambiguity', 'vague_discomfort'] },
  { id: 'quiet_plea', reqNodes: ['loneliness', 'seeking_understanding'] },
  { id: 'fragile_optimism', reqNodes: ['faint_hope'] },
]

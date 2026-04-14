// Mapping Catalog for Cheese Machine 75
// 写像カタログ: このアプリで起きている主要な情報変換を一覧で明示する
//
// 「写像」とは、ある世界の情報を別の世界の情報へ変換する責務を指す。
// このファイルは実行ロジックを持たず、どの変換がどこで行われるかを
// コードベースで追いやすくするための辞書として機能する。

/** 写像の記述子 */
export type MappingDescriptor = {
  /** 写像の識別子 (例: "M2") */
  id: string
  /** 写像の名前 */
  name: string
  /** 入力の意味ラベル */
  inputLabel: string
  /** 出力の意味ラベル */
  outputLabel: string
  /** この変換が何をしているかの説明 */
  description: string
  /** 主な実装箇所 */
  implementedIn: string
}

/**
 * Cheese Machine 75 の主要写像一覧
 *
 * Raw → Measured → Inferred → Revised の変換経路を明示する。
 * 各写像の実装は implementedIn に示したファイルで確認できる。
 */
export const OBSERVATION_MAPPINGS: MappingDescriptor[] = [
  {
    id: 'M2',
    name: 'EventToMeasured',
    inputLabel: 'Event (Raw image / frame features)',
    outputLabel: 'Measured (EventFeatures)',
    description:
      'カメラフレームや検出イベントの生データから、測定値 (brightness, linearity, noise など) を抽出する。' +
      ' Raw 層から Measured 層への変換。',
    implementedIn: 'src/core/observation/extractEventFeatures.ts',
  },
  {
    id: 'M4',
    name: 'MeasuredToNodes',
    inputLabel: 'Measured (EventFeatures) + ObservationContext',
    outputLabel: 'Nodes (activatedNodes, bindings, liftedPatterns)',
    description:
      '測定値と観測コンテキストをもとに観測ノードを発火させ、バインディングとパターンを立てる。' +
      ' Measured 層から Nodes (Inferred への中間) への変換。',
    implementedIn: 'src/core/runObservationPipeline.ts',
  },
  {
    id: 'M6',
    name: 'NodesToStateVector',
    inputLabel: 'Nodes / Bindings / Patterns / Features',
    outputLabel: 'ObservationStateVector',
    description:
      '発火したノード群・その関係・持ち上がったパターンと測定特徴量を束ねて、' +
      ' confidence / artifactRisk / claimStrength などの観測状態ベクトルへ写像する。',
    implementedIn: 'src/core/observation/buildObservationStateVector.ts',
  },
  {
    id: 'M8',
    name: 'StateToCaution',
    inputLabel: 'ObservationStateVector + activated nodes',
    outputLabel: 'ObservationHomeCheck (cautionUp / softenClaim / holdAsInteresting / keepAsStrongCandidate)',
    description:
      'パイプラインが出した状態ベクトルとノード情報から、観測主張の慎重度を判定する。' +
      ' 過剰な主張を防ぎ、測定の不確実性を適切に伝える層。',
    implementedIn: 'src/core/observation/buildObservationHomeCheck.ts',
  },
  {
    id: 'M10',
    name: 'PipelineToGuide',
    inputLabel: 'ObservationPipelineResult + ObservationHomeCheck',
    outputLabel: 'GuideBundle (quickGuide / deepGuide / bridgeGuide / cautionNotes)',
    description:
      'パイプライン結果とホームチェック結果をもとに、人間が読める解釈ガイドを生成する。' +
      ' 断定ではなく「測定・仮説・保留」を橋渡しする役割を担う。',
    implementedIn: 'src/core/guide/buildGuideText.ts',
  },
  {
    id: 'M11',
    name: 'LayersToCrystal',
    inputLabel: 'Raw + Measured (pipelineResult) + Inferred (guideBundle) + HomeCheck',
    outputLabel: 'ObservationCrystal',
    description:
      'Raw 画像 URI・測定値・推論結果・ホームチェック・改訂履歴を一つの記録単位（Crystal）にまとめる。' +
      ' Crystal は単なる保存データではなく、複数の観測層を束ねた結晶化された記録。',
    implementedIn: 'src/core/buildObservationCrystal.ts',
  },
]

/** 写像 ID で写像記述子を取得するヘルパー */
export function getMappingById(id: string): MappingDescriptor | undefined {
  return OBSERVATION_MAPPINGS.find((m) => m.id === id)
}

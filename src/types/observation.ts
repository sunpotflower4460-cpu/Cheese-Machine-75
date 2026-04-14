// Observation-specific types for Cheese Machine 75
// Built on Node-AI-Z pipeline philosophy

/** Raw features extracted from a detected event image/frame */
export type EventFeatures = {
  brightness: number       // 0–1 overall brightness level
  length: number           // 0–1 normalized track length
  width: number            // 0–1 normalized track width
  linearity: number        // 0–1 how straight the track is
  curvature: number        // 0–1 how curved the track is
  scatterScore: number     // 0–1 how scattered the signal is
  clusterScore: number     // 0–1 how clustered/dense the signal is
  rarityScore: number      // 0–1 how unusual this event is vs baseline
  noiseScore: number       // 0–1 estimated noise contamination
}

/** Context around the observation (device, environment) */
export type ObservationContext = {
  deviceId: string
  sessionId: string
  timestamp: string
  exposureMs: number
  temperature?: number     // sensor temperature if available
  notes?: string
}

/**
 * State vector specific to observation – parallel to Node-AI-Z StateVector.
 * M6 が Nodes / Bindings / Patterns / Features から組み立てる中間的な解釈状態。
 */
export type ObservationStateVector = {
  confidence: number       // 解釈全体をどれだけ信用できるか
  artifactRisk: number     // センサー由来アーティファクトである危険度
  particleLikelihood: number // 粒子イベント仮説の強さ
  noiseLevel: number       // 測定ノイズの強さ
  raritySignal: number     // ベースラインからの珍しさ
  geometryClarity: number  // 形状がどれだけ追いやすいか
  claimStrength: number    // どれだけ強い言い方が許されるか
  caution: number          // 解釈時に保持すべき慎重度
}

/** Input to the observation pipeline */
export type ObservationInput = {
  eventId: string
  features: EventFeatures
  context: ObservationContext
  rawImageUri?: string     // placeholder or base64 for MVP
  notes?: string
}

/** Full result from the observation pipeline */
export type ObservationPipelineResult = {
  input: ObservationInput
  activatedNodes: ObservationNode[]
  suppressedNodes: SuppressedObservationNode[]
  bindings: ObservationBinding[]
  liftedPatterns: ObservationPattern[]
  stateVector: ObservationStateVector
  debugNotes: string[]
  meta: {
    retrievalCount: number
    bindingCount: number
    patternCount: number
    elapsedMs: number
  }
}

/** A node in the observation node dictionary */
export type ObservationNode = {
  id: string
  label: string
  category: ObservationNodeCategory
  value: number            // activation strength 0–1
  reasons: string[]
}

export type SuppressedObservationNode = {
  id: string
  label: string
  value: number
  reason: string
}

export type ObservationNodeCategory =
  | 'signal'       // actual signal features
  | 'artifact'     // known artifact patterns
  | 'geometry'     // geometric interpretation
  | 'context'      // contextual factors
  | 'hypothesis'   // interpretive hypotheses
  | 'system'       // system/fallback nodes

/** Binding between two observation nodes */
export type ObservationBinding = {
  id: string
  source: string
  target: string
  type: string
  weight: number
  reasons: string[]
}

/** A lifted pattern from observation node combinations */
export type ObservationPattern = {
  id: string
  label: string
  score: number
  matchedNodes: string[]
  matchedRelations: string[]
}

/** Guide bundle – the main output shown to the user */
export type GuideBundle = {
  quickGuide: string       // brief 1-2 sentence summary
  deepGuide: string        // detailed analysis with reasoning
  bridgeGuide: string      // what to do next / connections to other events
  cautionNotes: string[]   // explicit cautions / alternative interpretations
}

/** A revision/re-evaluation entry for an observation */
export type ObservationRevisionEntry = {
  id: string
  crystalId: string        // which crystal this revises
  timestamp: string
  note: string             // re-evaluation memo
  revisedGuide?: Partial<GuideBundle>
  trigger: 'manual' | 'similar_found' | 'recheck_flag'
}

/** Home/caution check result for observation pipeline */
export type ObservationHomeCheck = {
  cautionUp: boolean           // increase caution display
  softenClaim: boolean         // soften the claim language
  holdAsInteresting: boolean   // flag as interesting but not conclusive
  keepAsStrongCandidate: boolean // allow strong candidate claim
  reasons: string[]
}

/** Overlay hypothesis for simulation display */
export type OverlayHypothesis = {
  id: string
  /**
   * measured:  shape directly derived from observed / extracted data (Measured layer)
   * predicted: helper line inferred from current measured features
   * simulated: hypothesis-driven overlay line for comparison (Inferred layer)
   */
  kind: 'measured' | 'predicted' | 'simulated'
  label: string
  points: Array<{ x: number; y: number }>
  confidence: number
  color?: string
}

/** One complete observation crystal – the unit of storage */
export type ObservationCrystal = {
  id: string
  createdAt: string
  // ----- Raw 層 -----
  rawImageUri: string          // placeholder or base64
  overlayImageUri: string      // placeholder or base64
  // ----- Measured 層 (M2 出力) -----
  features: EventFeatures
  // ----- Inferred 層 (M4 出力 + M10 出力) -----
  pipelineResult: ObservationPipelineResult
  guideBundle: GuideBundle
  // ----- Caution 層 (M8 出力) -----
  homeCheck: ObservationHomeCheck
  // ----- Revised 層 -----
  revisionHistory: ObservationRevisionEntry[]
  memoryLinks: string[]        // ids of similar crystals
  recheckFlag: boolean
  tags: string[]
}

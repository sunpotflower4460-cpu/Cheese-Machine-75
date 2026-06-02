// Observation-specific types for Cheese Machine 75
// Built on Node-AI-Z pipeline philosophy

/** Raw features extracted from a detected event image/frame (Measured layer — M2 output) */
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

export type BrightnessStats = {
  mean: number
  median: number
  std: number
  max: number
  min: number
  threshold: number
}

export type ForegroundPixel = {
  x: number
  y: number
  luminance: number
}

export type ForegroundMask = {
  width: number
  height: number
  threshold: number
  pixels: ForegroundPixel[]
  count: number
  ratio: number
}

export type DetectedComponent = {
  id: string
  pixels: ForegroundPixel[]
  pixelCount: number
  centroid: { x: number; y: number }
  boundingBox: { x: number; y: number; width: number; height: number }
  maxLuminance: number
  meanLuminance: number
  totalLuminance: number
}

export type ConnectedComponents = {
  components: DetectedComponent[]
  acceptedComponents: DetectedComponent[]
  rejectedComponents: DetectedComponent[]
  filteredCount: number
  minPixelCount: number
  connectivity: 4 | 8
  sortBy: 'pixelCount' | 'totalLuminance'
}

export type DetectedTrack = {
  id: string
  componentId: string
  kind?: 'spot' | 'short-line' | 'long-line' | 'cluster' | 'curved' | 'unknown'
  points: Array<{ x: number; y: number }>
  principalAxis: {
    start: { x: number; y: number }
    end: { x: number; y: number }
    angleRad: number
  }
  lengthPx: number
  widthPx: number
  linearity: number
  curvature: number
  confidence: number
}

export type ThresholdSignal = {
  stats: BrightnessStats
  foreground: ForegroundMask
  components?: ConnectedComponents
  detectedTracks?: DetectedTrack[]
  extractionError?: string
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
 * Inferred layer — M6 が Nodes / Bindings / Patterns / Features から組み立てる推定状態。
 * (Measured features を起点に pipeline が構築するため Inferred に属する)
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

export type StateContributor = {
  sourceType: 'feature' | 'node' | 'pattern'
  sourceId: string
  label: string
  weight?: number
  reason?: string
}

export type StateContributionMap = Partial<Record<keyof ObservationStateVector, StateContributor[]>>

/** Source type for an observation input — Raw layer: distinguishes where the raw input came from */
export type ObservationSourceType = 'sample' | 'uploaded-image' | 'camera'

/**
 * Measurement provenance — describes HOW the Measured layer values were produced.
 * This is the trust boundary: the app must never imply placeholder values are real pixel measurements.
 *
 * - `sample-authored`       : values authored by a human for demo/testing purposes
 * - `placeholder-dimension` : values derived from image dimensions/metadata, NOT from pixel analysis
 * - `pixel-derived`         : values extracted from actual pixel analysis (real measurements)
 * - `calibrated-pixel`      : pixel-derived values that have been calibrated against a reference
 * - `temporal-difference`   : values computed from a temporal diff of multiple frames
 * - `external-agent`        : values supplied by an external system or agent
 */
export type MeasuredSource =
  | 'sample-authored'
  | 'placeholder-dimension'
  | 'pixel-derived'
  | 'calibrated-pixel'
  | 'temporal-difference'
  | 'external-agent'

export type DataQualityFlag =
  | 'placeholder-measurement'
  | 'baseline-missing'
  | 'calibration-stale'
  | 'light-leak-suspected'
  | 'frame-too-bright'
  | 'low-signal'
  | 'hot-pixel-overlap-high'
  | 'thermal-noise-high'
  | 'device-moving'
  | 'compression-risk'
  | 'good-dark-frame'
  | 'stable-device'
  | 'calibrated-session'

export type QualityAssessment = {
  flags: DataQualityFlag[]
  lightLeakScore?: number
  stabilityScore?: number
  thermalNoiseScore?: number
  calibrationQuality?: number
  compressionRisk?: number
  notes: string[]
}

/**
 * Detection algorithm identifier — which algorithm produced the Measured values.
 * - `authored-v1`         : human-authored sample values (no algorithm)
 * - `placeholder-v1`      : dimension-derived placeholder (Phase 0)
 * - `pixel-edge-v1`       : future: pixel edge-detection algorithm
 * - `pixel-ml-v1`         : future: machine-learning pixel classifier
 * - `temporal-diff-v1`    : future: temporal-difference frame algorithm
 * - `external-agent-v1`   : future: external agent / API-supplied values
 */
export type DetectionAlgorithmId =
  | 'authored-v1'
  | 'placeholder-v1'
  | 'pixel-edge-v1'
  | 'pixel-ml-v1'
  | 'temporal-diff-v1'
  | 'external-agent-v1'

/**
 * Analysis Provenance — records exactly how each measured result was produced.
 * Attached to every ObservationCrystal so Studio and Event Detail can answer:
 * "Where did this value come from?"
 *
 * Measured 層  (Measured layer) の出所を記録する監査レコード。
 */
export type AnalysisProvenance = {
  /** Which measurement method produced the values (mirrors crystal.measuredSource) */
  measuredSource: MeasuredSource
  /** Which algorithm was used to extract features */
  algorithmId: DetectionAlgorithmId
  /** Semantic version of the analysis pipeline at time of creation */
  analysisVersion: string
  /** ISO-8601 timestamp when the analysis was performed */
  createdAt: string
  /** Category of raw input that was analysed */
  rawInputKind: 'sample' | 'uploaded-image' | 'camera-frame' | 'camera-session' | 'external-json'
  /** Reference to the calibration dataset used (if any) */
  calibrationId?: string
  /** Status of calibration at time of analysis */
  calibrationStatus: 'none' | 'available' | 'stale' | 'applied'
  /** Known limitations of this analysis method */
  limitations: string[]
  /** Active warnings that applied at analysis time */
  warnings: string[]
}

/** Input to the observation pipeline — bundles Raw and the Measured features derived from it */
export type ObservationInput = {
  eventId: string
  features: EventFeatures
  thresholdSignal?: ThresholdSignal
  qualityAssessment?: QualityAssessment
  context: ObservationContext
  rawImageUri?: string     // placeholder, base64, or object URL
  notes?: string
  sourceType?: ObservationSourceType  // where did this input come from?
  measuredSource?: MeasuredSource     // how were the Measured features produced?
}

/** Full result from the observation pipeline — Inferred layer (M4 → M6 outputs) */
export type ObservationPipelineResult = {
  input: ObservationInput
  qualityAssessment: QualityAssessment
  activatedNodes: ObservationNode[]
  suppressedNodes: SuppressedObservationNode[]
  bindings: ObservationBinding[]
  liftedPatterns: ObservationPattern[]
  stateVector: ObservationStateVector
  stateContributions: StateContributionMap
  debugNotes: string[]
  meta: {
    retrievalCount: number
    bindingCount: number
    patternCount: number
    elapsedMs: number
  }
}

/** A node in the observation node dictionary — Inferred layer (M4 output) */
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

/** Binding between two observation nodes — Inferred layer (M4 output) */
export type ObservationBinding = {
  id: string
  source: string
  target: string
  type: string
  weight: number
  reasons: string[]
}

/** A lifted pattern from observation node combinations — Inferred layer (M4 output) */
export type ObservationPattern = {
  id: string
  label: string
  score: number
  matchedNodes: string[]
  matchedRelations: string[]
}

/** Guide bundle – the main output shown to the user — Inferred layer (M10 output) */
export type GuideBundle = {
  quickGuide: string       // brief 1-2 sentence summary
  deepGuide: string        // detailed analysis with reasoning
  bridgeGuide: string      // what to do next / connections to other events
  cautionNotes: string[]   // explicit cautions / alternative interpretations
}

/** A revision/re-evaluation entry for an observation — Revised layer */
export type ObservationRevisionEntry = {
  id: string
  crystalId: string        // which crystal this revises
  timestamp: string
  note: string             // re-evaluation memo
  revisedGuide?: Partial<GuideBundle>
  trigger: 'manual' | 'similar_found' | 'recheck_flag'
}

/**
 * Morphology candidate classification — Inferred layer.
 * Describes the visual/geometric shape class of the detected candidate.
 * This is a cautious label only — it does NOT imply physical origin.
 *
 * Use careful wording: "track-like morphology", not "muon track".
 */
export type MorphologyClass =
  | 'track'      // high linearity, long/narrow
  | 'worm'       // curved/moderate linearity, non-trivial length
  | 'spot'       // small, compact, low length
  | 'cluster'    // dense area, low linearity, larger region
  | 'artifact'   // quality/hot-pixel evidence
  | 'unknown'    // insufficient or conflicting geometry

/**
 * A single morphology classification result — Inferred layer (derived from Measured features).
 * Always presented as a candidate only — never as confirmed physical origin.
 */
export type MorphologyCandidate = {
  /** The cautious shape class assigned to this candidate. */
  morphologyClass: MorphologyClass
  /**
   * Confidence in the morphology classification (0–1).
   * Down-weighted when quality flags are high.
   */
  confidence: number
  /**
   * Display label using careful wording.
   * Examples: "track-like morphology", "spot-like candidate", "artifact-like pattern".
   */
  label: string
  /** Feature conditions that led to this classification. */
  reasons: string[]
  /**
   * Caution notes — present when noise/quality is high or geometry is ambiguous.
   * These should be shown in the UI alongside the morphology label.
   */
  cautionNotes: string[]
}

/** Home/caution check result for observation pipeline — Inferred layer (M8 output) */
export type ObservationHomeCheck = {
  cautionUp: boolean           // increase caution display
  softenClaim: boolean         // soften the claim language
  holdAsInteresting: boolean   // flag as interesting but not conclusive
  keepAsStrongCandidate: boolean // allow strong candidate claim
  reasons: string[]
}

/**
 * Provenance of an overlay shape.
 *
 * measured:    drawn directly from real detected coordinates (DetectedTrack)
 * inferred:    derived / extrapolated from measured data (predicted extension)
 * simulated:   hypothesis-driven model line for comparison only
 * placeholder: feature-generated stand-in; not derived from real pixel geometry
 */
export type OverlayOrigin = 'measured' | 'inferred' | 'simulated' | 'placeholder'

/** Overlay hypothesis for simulation display */
export type OverlayHypothesis = {
  id: string
  /**
   * measured:  shape directly derived from observed / extracted data (Measured layer)
   * predicted: helper line inferred from current measured features
   * simulated: hypothesis-driven overlay line for comparison (Inferred layer)
   */
  kind: 'measured' | 'predicted' | 'simulated'
  /** Provenance of this overlay — prevents UI from treating inferred/simulated lines as measured */
  origin: OverlayOrigin
  label: string
  points: Array<{ x: number; y: number }>
  confidence: number
  color?: string
}

/** One complete observation crystal – the unit of storage.
 *
 * Crystal は複数の観測層を束ねた記録単位:
 *   Raw      ... sourceType, rawImageUri, overlayImageUri — unprocessed origin
 *   Measured ... features (EventFeatures) — directly measured from raw input (M2)
 *   Inferred ... pipelineResult (nodes/bindings/patterns/stateVector), guideBundle, homeCheck — pipeline conclusions (M4–M10)
 *   Revised  ... revisionHistory, memoryLinks, recheckFlag — post-evaluation updates
 */
export type ObservationCrystal = {
  id: string
  createdAt: string
  // ----- Raw 層 -----
  // Unprocessed origin: where the raw input came from and the raw image itself
  rawImageUri: string          // placeholder, base64, or object URL — Raw source
  overlayImageUri: string      // placeholder or base64 — Raw/overlay reference
  sourceType: ObservationSourceType  // 'sample' | 'uploaded-image' | 'camera' — Raw origin tag
  // ----- Measured 層 (M2 出力) -----
  // Directly measured from raw input: numerical feature extraction only
  features: EventFeatures
  measuredSource: MeasuredSource      // how were the features produced? (measurement provenance)
  analysisProvenance: AnalysisProvenance  // full audit record: algorithm, version, limitations, warnings
  // ----- Inferred 層 (M4–M10 出力) -----
  // What the pipeline constructs from measured data:
  // nodes, bindings, patterns, stateVector (M4/M6), homeCheck (M8), guideBundle (M10)
  pipelineResult: ObservationPipelineResult
  guideBundle: GuideBundle
  homeCheck: ObservationHomeCheck
  /** Morphology candidate classification — Inferred layer. Cautious shape label only; not a physical origin claim. */
  morphologyCandidate: MorphologyCandidate
  // ----- Revised 層 -----
  // Post-evaluation: revision history, memory links, recheck flags, later updates
  revisionHistory: ObservationRevisionEntry[]
  memoryLinks: string[]        // ids of similar crystals
  recheckFlag: boolean
  tags: string[]
}

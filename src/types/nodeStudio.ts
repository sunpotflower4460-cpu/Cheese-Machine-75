export type CoreNode = { id: string; label: string; category: string; value: number; reasons: string[] }
export type SuppressedNode = { id: string; label: string; value: number; reason: string }
export type Binding = { id: string; source: string; target: string; type: string; weight: number; reasons: string[] }
export type LiftedPattern = { id: string; label: string; score: number; matchedNodes: string[]; matchedRelations: string[] }
export type StateVector = { fragility: number; urgency: number; depth: number; care: number; agency: number; ambiguity: number; change: number; stability: number; self: number; relation: number; light: number; heaviness: number }

export type NodePipelineResult = {
  inputText: string
  activatedNodes: CoreNode[]
  suppressedNodes: SuppressedNode[]
  bindings: Binding[]
  liftedPatterns: LiftedPattern[]
  stateVector: StateVector
  debugNotes: string[]
  meta: { retrievalCount: number; bindingCount: number; patternCount: number; elapsedMs: number }
}

export type HomeMode = 'stable' | 'shaken' | 'overperforming' | 'withdrawing' | 'returning' | 'resting'
export type ReturnMode = 'none' | 'stillness' | 'relation' | 'boundary' | 'rest'
export type HomeCheckReason = 'none' | 'overperformance' | 'hostile_input' | 'ambiguity_overload' | 'fragility' | 'trust_drop'

export type HomeState = {
  worthDetached: number
  urgencyRelease: number
  expectationRelease: number
  belongingSignal: number
  safeReturnStrength: number
  selfNonCollapse: number
  currentMode: HomeMode
}

export type HomeCheckResult = {
  needsReturn: boolean
  returnMode: ReturnMode
  reason: HomeCheckReason
  homePhrase: string
  released: string[]
  preserved: string[]
}

export type ReturnTrace = {
  timestamp: string
  trigger: string
  returnMode: ReturnMode
  homePhrase: string
  reason: HomeCheckReason
  beforeTone: string
  afterTone: string
}

export type StudioPattern = LiftedPattern & { titleJa: string; simpleDescJa: string; internalDescription: string }
export type StudioInternalProcess = { label: string; desc: string; content: string; origin: string }

export type StudioViewModel = {
  mainState: CoreNode | null
  mainConflict: Binding | null
  mainPattern: StudioPattern | null
  flowSummaryText: string
  rawReplyPreview: string
  adjustedReplyPreview: string
  responseMeta: { time: string; temperature: string; withheld: string; wording: string }
  internalProcess: StudioInternalProcess[]
  guideObserves: { summary: string; uncertainty: string; naturalnessAdvice: string }
  enrichedPatterns: StudioPattern[]
  homeState: HomeState
  homeCheck: HomeCheckResult
  returnTrace: ReturnTrace
}

export type HistoryItem = {
  id: number
  text: string
  time: string
  pipelineResult: NodePipelineResult
}

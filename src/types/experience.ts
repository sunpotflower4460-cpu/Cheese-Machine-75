import type { NodePipelineResult, RevisionEntry, StudioViewModel } from './nodeStudio'

export type AppMode = 'observe' | 'experience'
export type ObservationSource = AppMode

export type ObservationRecord = {
  id: string
  type: ObservationSource
  text: string
  timestamp: string
  time: string
  pipelineResult: NodePipelineResult
  studioView: StudioViewModel
  revisionEntry: RevisionEntry
  assistantReply: string
}

export type ExperienceMessage = {
  id: string
  observationId: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
  pipelineResult?: NodePipelineResult
  studioView?: StudioViewModel
  revisionEntry?: RevisionEntry
}

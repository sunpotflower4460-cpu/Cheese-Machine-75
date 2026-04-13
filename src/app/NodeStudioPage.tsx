import { useCallback, useEffect, useMemo, useState } from 'react'
import { BrainCircuit } from 'lucide-react'
import { runNodePipeline } from '../core/runNodePipeline'
import { buildStudioViewModel } from '../studio/buildStudioViewModel'
import { buildRevisionEntry } from '../revision/buildRevisionEntry'
import { loadRevisionState, saveRevisionState, clearRevisionState } from '../revision/revisionStorage'
import { applyUserTuning } from '../revision/applyUserTuning'
import { loadExperienceMessages, saveExperienceMessages } from '../storage/experienceStorage'
import type { ExperienceMessage, AppMode, ObservationRecord } from '../types/experience'
import type { NodePipelineResult, RevisionEntry, RevisionState, StudioViewModel, UserTuningAction } from '../types/nodeStudio'
import { ModeSwitch } from '../ui/components/ModeSwitch'
import { ExperienceMode } from '../ui/modes/ExperienceMode'
import { ObserveMode } from '../ui/modes/ObserveMode'

const createId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  const highResolutionTime = typeof performance !== 'undefined' ? performance.now().toFixed(5) : '0'
  return `${prefix}_${Date.now()}_${highResolutionTime}_${Math.random().toString(36).slice(2, 8)}`
}

const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const hasObservationData = (
  message: ExperienceMessage,
): message is ExperienceMessage & { pipelineResult: NodePipelineResult; studioView: StudioViewModel; revisionEntry: RevisionEntry } => {
  return message.role === 'assistant' && Boolean(message.pipelineResult && message.studioView && message.revisionEntry)
}

export default function NodeStudioPage() {
  const [mode, setMode] = useState<AppMode>('observe')
  const [currentObservation, setCurrentObservation] = useState<ObservationRecord | null>(null)
  const [observeHistory, setObserveHistory] = useState<ObservationRecord[]>([])
  const [experienceMessages, setExperienceMessages] = useState<ExperienceMessage[]>(() => loadExperienceMessages())
  const [revisionState, setRevisionState] = useState<RevisionState>(() => loadRevisionState())

  useEffect(() => {
    saveRevisionState(revisionState)
  }, [revisionState])

  useEffect(() => {
    saveExperienceMessages(experienceMessages)
  }, [experienceMessages])

  const addRevisionEntryToMemory = useCallback((entry: RevisionEntry) => {
    setRevisionState((previous) => {
      if (previous.memory.entries.some((existingEntry) => existingEntry.id === entry.id)) {
        return previous
      }

      return {
        ...previous,
        memory: {
          ...previous.memory,
          entries: [entry, ...previous.memory.entries],
          ephemeral: entry.status === 'ephemeral' ? [entry, ...previous.memory.ephemeral] : previous.memory.ephemeral,
        },
      }
    })
  }, [])

  const createObservation = useCallback((text: string, type: ObservationRecord['type']): ObservationRecord => {
    const pipelineResult = runNodePipeline(text)
    const studioView = buildStudioViewModel(pipelineResult)
    const revisionEntry = buildRevisionEntry(pipelineResult, studioView)
    const timestamp = new Date().toISOString()

    return {
      id: createId(type),
      type,
      text,
      timestamp,
      time: formatTime(timestamp),
      pipelineResult,
      studioView,
      revisionEntry,
      assistantReply: studioView.adjustedReplyPreview,
    }
  }, [])

  const experienceHistory = useMemo<ObservationRecord[]>(() => {
    return experienceMessages
      .filter(hasObservationData)
      .map((message) => ({
        id: message.observationId,
        type: 'experience' as const,
        text: message.pipelineResult.inputText,
        timestamp: message.timestamp,
        time: formatTime(message.timestamp),
        pipelineResult: message.pipelineResult,
        studioView: message.studioView,
        revisionEntry: message.revisionEntry,
        assistantReply: message.text,
      }))
  }, [experienceMessages])

  const history = useMemo(() => {
    return [...observeHistory, ...experienceHistory].sort((first, second) => {
      return new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()
    })
  }, [experienceHistory, observeHistory])

  const handleObserveAnalyze = useCallback((text: string) => {
    const record = createObservation(text, 'observe')
    addRevisionEntryToMemory(record.revisionEntry)
    setObserveHistory((previous) => [record, ...previous])
    setCurrentObservation(record)
  }, [addRevisionEntryToMemory, createObservation])

  const handleExperienceSend = useCallback((text: string) => {
    const record = createObservation(text, 'experience')
    const turnTimestamp = record.timestamp

    addRevisionEntryToMemory(record.revisionEntry)
    setCurrentObservation(record)
    setExperienceMessages((previous) => [
      ...previous,
      {
        id: createId('exp_user'),
        observationId: record.id,
        role: 'user',
        text,
        timestamp: turnTimestamp,
        pipelineResult: record.pipelineResult,
        studioView: record.studioView,
        revisionEntry: record.revisionEntry,
      },
      {
        id: createId('exp_assistant'),
        observationId: record.id,
        role: 'assistant',
        text: record.assistantReply,
        timestamp: turnTimestamp,
        pipelineResult: record.pipelineResult,
        studioView: record.studioView,
        revisionEntry: record.revisionEntry,
      },
    ])
  }, [addRevisionEntryToMemory, createObservation])

  const handleRestoreObservation = useCallback((record: ObservationRecord) => {
    setCurrentObservation(record)
  }, [])

  const handleOpenObservation = useCallback((observationId: string) => {
    const record = history.find((item) => item.id === observationId)
    if (!record) {
      return
    }

    setCurrentObservation(record)
    setMode('observe')
  }, [history])

  const handleResetCurrent = useCallback(() => {
    setCurrentObservation(null)
  }, [])

  const handleTuningAction = useCallback((entryId: string, changeId: string, action: UserTuningAction) => {
    setRevisionState((previous) => applyUserTuning(previous, entryId, changeId, action))
  }, [])

  const handleClearRevision = useCallback(() => {
    if (confirm('Clear all revision data? This cannot be undone.')) {
      clearRevisionState()
      setRevisionState(loadRevisionState())
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-[1080px] flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 md:text-xl">
              <BrainCircuit className="h-5 w-5 text-indigo-600 md:h-6 md:w-6" />
              Node-AI-Z
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">SRM-1 / Foundation</span>
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              研究するための観察ビューと、実際に話すための体験ビューを往復しながら、育つ知性を見ていく実験アプリ。
            </p>
          </div>
          <ModeSwitch mode={mode} onChange={setMode} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-6 px-4 py-6 md:px-6">
        {mode === 'observe' ? (
          <ObserveMode
            currentObservation={currentObservation}
            history={history}
            revisionState={revisionState}
            onAnalyze={handleObserveAnalyze}
            onRestore={handleRestoreObservation}
            onResetCurrent={handleResetCurrent}
            onTuningAction={handleTuningAction}
            onClearRevision={handleClearRevision}
          />
        ) : (
          <ExperienceMode
            messages={experienceMessages}
            onSend={handleExperienceSend}
            onOpenObservation={handleOpenObservation}
          />
        )}
      </main>
    </div>
  )
}

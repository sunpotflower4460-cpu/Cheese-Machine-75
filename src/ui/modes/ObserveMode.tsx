import { useState } from 'react'
import { Activity, BrainCircuit, ChevronDown, ChevronUp, Compass, GitPullRequest, Home, MessageSquareText, RefreshCw, Search, Terminal } from 'lucide-react'
import type { ObservationRecord } from '../../types/experience'
import type { RevisionState, UserTuningAction } from '../../types/nodeStudio'
import { HistoryTab } from '../tabs/HistoryTab'
import { HomeTab } from '../tabs/HomeTab'
import { PatternsTab } from '../tabs/PatternsTab'
import { RelationsTab } from '../tabs/RelationsTab'
import { ReplyTab } from '../tabs/ReplyTab'
import { StatesTab } from '../tabs/StatesTab'
import { RevisionTab } from '../tabs/RevisionTab'

const SAMPLE_INPUTS = [
  '仕事に対する意欲が湧かなくて、転職すべきか悩んでいる',
  '最近ずっと、自分のことを信じきれない',
  'なんとなく引っかかるけど、まだ言葉にできない',
  'ただ分かってほしいだけなのかもしれない',
  '少しだけ希望はある気がする',
]

type ActiveTab = 'Reply' | 'States' | 'Relations' | 'Patterns' | 'Home' | 'History' | 'Revision'
type RawViewMode = 'pipeline' | 'view' | 'home' | 'revision'

type ObserveModeProps = {
  currentObservation: ObservationRecord | null
  history: ObservationRecord[]
  revisionState: RevisionState
  onAnalyze: (text: string) => void
  onRestore: (item: ObservationRecord) => void
  onResetCurrent: () => void
  onTuningAction: (entryId: string, changeId: string, action: UserTuningAction) => void
  onClearRevision: () => void
}

export const ObserveMode = ({
  currentObservation,
  history,
  revisionState,
  onAnalyze,
  onRestore,
  onResetCurrent,
  onTuningAction,
  onClearRevision,
}: ObserveModeProps) => {
  const [inputText, setInputText] = useState(currentObservation?.text ?? '')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('Reply')
  const [isRawOpen, setIsRawOpen] = useState(false)
  const [rawViewMode, setRawViewMode] = useState<RawViewMode>('pipeline')
  const [isProcessOpen, setIsProcessOpen] = useState(true)

  const handleAnalyze = () => {
    const trimmed = inputText.trim()
    if (!trimmed || isAnalyzing) {
      return
    }

    setIsAnalyzing(true)

    window.setTimeout(() => {
      onAnalyze(trimmed)
      setActiveTab('Reply')
      setIsAnalyzing(false)
    }, 400)
  }

  const handleSampleClick = (text: string) => {
    setInputText(text)
    setIsAnalyzing(true)

    window.setTimeout(() => {
      onAnalyze(text)
      setActiveTab('Reply')
      setIsAnalyzing(false)
    }, 400)
  }

  const handleRestore = (item: ObservationRecord) => {
    setInputText(item.text)
    onRestore(item)
    setActiveTab('Reply')
    setIsRawOpen(false)
  }

  const handleResetView = () => {
    setInputText('')
    onResetCurrent()
  }

  const pipelineResult = currentObservation?.pipelineResult ?? null
  const studioView = currentObservation?.studioView ?? null
  const currentRevisionEntry = currentObservation?.revisionEntry ?? null

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-3xl border border-indigo-100 bg-white px-5 py-6 shadow-sm md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              <Compass className="h-4 w-4" />
              観察研究モード
            </div>
            <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900">
              <BrainCircuit className="h-6 w-6 text-indigo-600" />
              Node Studio
            </h2>
            <p className="mt-3 text-sm font-medium leading-relaxed text-slate-500 md:text-[15px]">
              内部プロセスを観察し、反応・構造・修正・帰還を研究するモードです。結晶思考モデルの挙動を見ながら、Node / Relation / Pattern / Home / Revision を比較・検証できます。
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetView}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
            表示をリセット
          </button>
        </div>
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={inputText}
                onChange={(event) => setInputText(event.target.value)}
                placeholder="テキストを入力して内部パイプラインを観察する..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-[15px] font-medium text-slate-800 transition-all focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleAnalyze()
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !inputText.trim()}
              aria-label={isAnalyzing ? '分析中' : '分析する'}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isAnalyzing ? <RefreshCw className="h-4.5 w-4.5 animate-spin" /> : <Activity className="h-4.5 w-4.5" />}
              Analyze
            </button>
          </div>
          <div className="scrollbar-hide flex items-center gap-2.5 overflow-x-auto pb-1">
            <span className="mr-1 flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400"><Terminal className="h-3.5 w-3.5" /> Samples</span>
            {SAMPLE_INPUTS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => handleSampleClick(sample)}
                className="shrink-0 rounded-lg border border-slate-200/60 bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-200"
              >
                {sample.length > 20 ? `${sample.substring(0, 20)}...` : sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {currentObservation && pipelineResult && studioView ? (
        <>
          <div className="flex min-w-0 flex-col gap-6">
            <div className="scrollbar-hide sticky top-[92px] z-10 flex gap-2 overflow-x-auto border-b-2 border-slate-100 bg-[#F8FAFC] pb-1 pt-1">
              {(['Reply', 'States', 'Relations', 'Patterns', 'Home', 'History', 'Revision'] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`-mb-[2px] flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-3 text-[15px] font-bold transition-colors ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'}`}
                >
                  {tab === 'Reply' ? <MessageSquareText className="h-4.5 w-4.5" /> : null}
                  {tab === 'Home' ? <Home className="h-4.5 w-4.5" /> : null}
                  {tab === 'Relations' ? <GitPullRequest className="h-4.5 w-4.5" /> : null}
                  {tab === 'Revision' ? <RefreshCw className="h-4.5 w-4.5" /> : null}
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col">
              {activeTab === 'Reply' ? <ReplyTab studioView={studioView} analyzedText={currentObservation.text} isProcessOpen={isProcessOpen} setIsProcessOpen={setIsProcessOpen} currentRevisionEntry={currentRevisionEntry} onTuningAction={onTuningAction} /> : null}
              {activeTab === 'Home' ? <HomeTab studioView={studioView} /> : null}
              {activeTab === 'States' ? <StatesTab pipelineResult={pipelineResult} /> : null}
              {activeTab === 'Relations' ? <RelationsTab pipelineResult={pipelineResult} /> : null}
              {activeTab === 'Patterns' ? <PatternsTab studioView={studioView} /> : null}
              {activeTab === 'History' ? <HistoryTab history={history} restoreHistory={handleRestore} /> : null}
              {activeTab === 'Revision' ? <RevisionTab revisionState={revisionState} currentEntry={currentRevisionEntry} onTuningAction={onTuningAction} onClearAll={onClearRevision} /> : null}
            </div>
          </div>

          <div className="mb-8 mt-8 flex shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="flex w-full flex-col items-center justify-between gap-3 border-b border-slate-800 bg-slate-950 p-3 sm:flex-row">
              <div className="flex flex-col gap-1 pl-2">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-300">Internal Data Inspect</span>
                </div>
                <div className="mt-1 flex gap-3 text-[10px] text-slate-500">
                  <span>source: {currentObservation.type}</span>
                  <span>retrieved: {pipelineResult.meta.retrievalCount}</span>
                  <span>bindings: {pipelineResult.meta.bindingCount}</span>
                  <span>patterns: {pipelineResult.meta.patternCount}</span>
                  <span>elapsed: {pipelineResult.meta.elapsedMs.toFixed(2)}ms</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setRawViewMode('pipeline'); setIsRawOpen(true) }} className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'pipeline' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Pipeline Raw</button>
                <button type="button" onClick={() => { setRawViewMode('view'); setIsRawOpen(true) }} className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'view' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Studio View</button>
                <button type="button" onClick={() => { setRawViewMode('home'); setIsRawOpen(true) }} className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'home' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Home View</button>
                <button type="button" onClick={() => { setRawViewMode('revision'); setIsRawOpen(true) }} className={`rounded px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'revision' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Revision</button>
                <button type="button" onClick={() => setIsRawOpen(!isRawOpen)} className="p-1.5 text-slate-500 hover:text-white">{isRawOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</button>
              </div>
            </div>
            {isRawOpen ? (
              <div className="max-h-[500px] overflow-y-auto break-all whitespace-pre-wrap bg-slate-900 p-5 font-mono text-xs leading-relaxed text-slate-300">
                {rawViewMode === 'pipeline' ? JSON.stringify(pipelineResult, null, 2) : null}
                {rawViewMode === 'view' ? JSON.stringify(studioView, null, 2) : null}
                {rawViewMode === 'home' ? JSON.stringify({ homeState: studioView.homeState, homeCheck: studioView.homeCheck, returnTrace: studioView.returnTrace, rawReplyPreview: studioView.rawReplyPreview, adjustedReplyPreview: studioView.adjustedReplyPreview }, null, 2) : null}
                {rawViewMode === 'revision' ? JSON.stringify({ currentEntry: currentRevisionEntry, revisionState: { plasticity: revisionState.plasticity, memoryCount: revisionState.memory.entries.length, tuningCounts: { locked: revisionState.tuning.locked.size, softened: revisionState.tuning.softened.size, reverted: revisionState.tuning.reverted.size, kept: revisionState.tuning.kept.size } } }, null, 2) : null}
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="my-4 flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 px-4 py-24 text-slate-400">
          <BrainCircuit className="mb-6 h-20 w-20 text-indigo-100" />
          <h2 className="mb-3 text-2xl font-bold text-slate-700">観察研究モードの準備ができています</h2>
          <p className="mb-10 max-w-md text-center text-[15px] font-medium leading-relaxed text-slate-500">
            テキストを入力すると、実際の Node Pipeline と Home Layer が走り、結晶AIの返答がどう結晶化したかを研究ビューで観察できます。
          </p>
        </div>
      )}

      {!currentObservation && history.length > 0 ? <HistoryTab history={history} restoreHistory={handleRestore} /> : null}
    </div>
  )
}

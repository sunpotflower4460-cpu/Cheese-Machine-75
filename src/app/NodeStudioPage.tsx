import { useMemo, useState } from 'react'
import { Activity, BrainCircuit, ChevronDown, ChevronUp, GitPullRequest, Home, MessageSquareText, RefreshCw, Search, Terminal } from 'lucide-react'
import { runNodePipeline } from '../core/runNodePipeline'
import { buildStudioViewModel } from '../studio/buildStudioViewModel'
import type { HistoryItem, NodePipelineResult } from '../types/nodeStudio'
import { HistoryTab } from '../ui/tabs/HistoryTab'
import { HomeTab } from '../ui/tabs/HomeTab'
import { PatternsTab } from '../ui/tabs/PatternsTab'
import { RelationsTab } from '../ui/tabs/RelationsTab'
import { ReplyTab } from '../ui/tabs/ReplyTab'
import { StatesTab } from '../ui/tabs/StatesTab'

const SAMPLE_INPUTS = [
  '仕事に対する意欲が湧かなくて、転職すべきか悩んでいる',
  '最近ずっと、自分のことを信じきれない',
  'なんとなく引っかかるけど、まだ言葉にできない',
  'ただ分かってほしいだけなのかもしれない',
  '少しだけ希望はある気がする',
]

type ActiveTab = 'Reply' | 'States' | 'Relations' | 'Patterns' | 'Home' | 'History'
type RawViewMode = 'pipeline' | 'view' | 'home'

export default function NodeStudioPage() {
  const [inputText, setInputText] = useState('')
  const [analyzedText, setAnalyzedText] = useState('')
  const [pipelineResult, setPipelineResult] = useState<NodePipelineResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [activeTab, setActiveTab] = useState<ActiveTab>('Reply')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isRawOpen, setIsRawOpen] = useState(false)
  const [rawViewMode, setRawViewMode] = useState<RawViewMode>('pipeline')
  const [isProcessOpen, setIsProcessOpen] = useState(true)

  const studioView = useMemo(() => {
    if (!pipelineResult) {
      return null
    }
    return buildStudioViewModel(pipelineResult)
  }, [pipelineResult])

  const executePipeline = (text: string) => {
    setIsAnalyzing(true)
    setAnalyzedText(text)

    setTimeout(() => {
      const result = runNodePipeline(text)
      setPipelineResult(result)
      setHistory((previous) => [
        {
          id: Date.now(),
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pipelineResult: result,
        },
        ...previous,
      ])
      setActiveTab('Reply')
      setIsAnalyzing(false)
    }, 400)
  }

  const handleAnalyze = () => {
    if (inputText.trim()) {
      executePipeline(inputText.trim())
    }
  }

  const handleSampleClick = (text: string) => {
    setInputText(text)
    executePipeline(text)
  }

  const handleReset = () => {
    setInputText('')
    setAnalyzedText('')
    setPipelineResult(null)
    setActiveTab('Reply')
    setIsRawOpen(false)
  }

  const restoreHistory = (item: HistoryItem) => {
    setInputText(item.text)
    setAnalyzedText(item.text)
    setPipelineResult(item.pipelineResult)
    setActiveTab('Reply')
    setIsRawOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
            Node Studio <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-full ml-2 uppercase tracking-wider">v0.8 Foundation Ready</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReset} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors" title="Reset Session"><RefreshCw className="w-4.5 h-4.5" /></button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-w-[860px] mx-auto w-full relative">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-5 shrink-0 z-10">
          <div className="flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  placeholder="テキストを入力して実際の内部パイプラインを通す..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      handleAnalyze()
                    }
                  }}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !inputText.trim()}
                className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-[15px] font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isAnalyzing ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : <Activity className="w-4.5 h-4.5" />} Analyze
              </button>
            </div>
            <div className="flex gap-2.5 items-center overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Samples</span>
              {SAMPLE_INPUTS.map((sample) => (
                <button key={sample} onClick={() => handleSampleClick(sample)} className="shrink-0 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200/60">
                  {sample.length > 20 ? `${sample.substring(0, 20)}...` : sample}
                </button>
              ))}
            </div>
          </div>
        </div>

        {pipelineResult && studioView ? (
          <div className="flex flex-col gap-6 min-w-0">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide border-b-2 border-slate-100 z-10 sticky top-[73px] bg-[#F8FAFC] pt-1">
              {(['Reply', 'States', 'Relations', 'Patterns', 'Home', 'History'] as ActiveTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-[15px] font-bold whitespace-nowrap transition-colors border-b-2 -mb-[2px] flex items-center gap-2 ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}
                >
                  {tab === 'Reply' ? <MessageSquareText className="w-4.5 h-4.5" /> : null}
                  {tab === 'Home' ? <Home className="w-4.5 h-4.5" /> : null}
                  {tab === 'Relations' ? <GitPullRequest className="w-4.5 h-4.5" /> : null}
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-col z-0">
              {activeTab === 'Reply' ? <ReplyTab studioView={studioView} analyzedText={analyzedText} isProcessOpen={isProcessOpen} setIsProcessOpen={setIsProcessOpen} /> : null}
              {activeTab === 'Home' ? <HomeTab studioView={studioView} /> : null}
              {activeTab === 'States' ? <StatesTab pipelineResult={pipelineResult} /> : null}
              {activeTab === 'Relations' ? <RelationsTab pipelineResult={pipelineResult} /> : null}
              {activeTab === 'Patterns' ? <PatternsTab studioView={studioView} /> : null}
              {activeTab === 'History' ? <HistoryTab history={history} restoreHistory={restoreHistory} /> : null}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 py-24 px-4 my-4">
            <BrainCircuit className="w-20 h-20 text-indigo-100 mb-6" />
            <h2 className="text-2xl font-bold text-slate-700 mb-3">Node Studio is ready</h2>
            <p className="text-[15px] font-medium text-slate-500 text-center max-w-md mb-10 leading-relaxed">
              テキストを入力すると、実際のNode PipelineとHome Layerが走り、結晶AIの発話に至るプロセスを観察できます。
            </p>
          </div>
        )}

        {pipelineResult && studioView ? (
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col overflow-hidden shrink-0 mt-8 mb-8">
            <div className="w-full flex flex-col sm:flex-row items-center justify-between bg-slate-950 border-b border-slate-800 p-3 gap-3">
              <div className="flex flex-col gap-1 pl-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest">Internal Data Inspect</span>
                </div>
                <div className="flex gap-3 text-[10px] text-slate-500 font-mono mt-1">
                  <span>retrieved: {pipelineResult.meta.retrievalCount}</span>
                  <span>bindings: {pipelineResult.meta.bindingCount}</span>
                  <span>patterns: {pipelineResult.meta.patternCount}</span>
                  <span>elapsed: {pipelineResult.meta.elapsedMs.toFixed(2)}ms</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setRawViewMode('pipeline'); setIsRawOpen(true) }} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'pipeline' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Pipeline Raw</button>
                <button onClick={() => { setRawViewMode('view'); setIsRawOpen(true) }} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'view' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Studio View</button>
                <button onClick={() => { setRawViewMode('home'); setIsRawOpen(true) }} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider ${rawViewMode === 'home' && isRawOpen ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-800'}`}>Home View</button>
                <button onClick={() => setIsRawOpen(!isRawOpen)} className="p-1.5 text-slate-500 hover:text-white">{isRawOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
              </div>
            </div>
            {isRawOpen ? (
              <div className="p-5 overflow-y-auto max-h-[500px] font-mono text-xs text-slate-300 bg-slate-900 break-all whitespace-pre-wrap leading-relaxed">
                {rawViewMode === 'pipeline' ? JSON.stringify(pipelineResult, null, 2) : null}
                {rawViewMode === 'view' ? JSON.stringify(studioView, null, 2) : null}
                {rawViewMode === 'home' ? JSON.stringify({ homeState: studioView.homeState, homeCheck: studioView.homeCheck, returnTrace: studioView.returnTrace, rawReplyPreview: studioView.rawReplyPreview, adjustedReplyPreview: studioView.adjustedReplyPreview }, null, 2) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  )
}

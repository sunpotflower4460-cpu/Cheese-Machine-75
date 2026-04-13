import { useState } from 'react'
import { MessageCircleHeart, Send, Sparkles } from 'lucide-react'
import type { ExperienceMessage } from '../../types/experience'

type ExperienceModeProps = {
  messages: ExperienceMessage[]
  onSend: (text: string) => void
  onOpenObservation: (observationId: string) => void
}

export const ExperienceMode = ({ messages, onSend, onOpenObservation }: ExperienceModeProps) => {
  const [inputText, setInputText] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSend = () => {
    const trimmed = inputText.trim()
    if (!trimmed || isSending) {
      return
    }

    setIsSending(true)
    setInputText('')

    window.setTimeout(() => {
      onSend(trimmed)
      setIsSending(false)
    }, 250)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="rounded-3xl border border-rose-100 bg-white px-5 py-6 shadow-sm md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
              <MessageCircleHeart className="h-4 w-4" />
              体験モード
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">自然に話しながら、裏では観察が積み上がる入口</h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-relaxed text-slate-500 md:text-[15px]">
              表では会話を主役にしつつ、裏では pipeline / home / revision が動きます。必要なときだけ観察研究モードに戻って、内部の変化を見返せます。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            内部では記録されています
          </div>
        </div>
      </section>

      <section className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
          {messages.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
              <div className="rounded-full bg-rose-100 p-4 text-rose-600">
                <MessageCircleHeart className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-800">ここから話し始められます</h3>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
                返答は既存の Node Pipeline / Home Layer / 返答調整レイヤーを通して生成されます。詳しい内部観察はあとから研究モードで開けます。
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isAssistant = message.role === 'assistant'

              return (
                <div key={message.id} className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] rounded-3xl px-4 py-3 shadow-sm ${isAssistant ? 'border border-slate-200 bg-slate-50 text-slate-800' : 'bg-rose-500 text-white'}`}>
                    <p className="whitespace-pre-wrap text-[15px] font-medium leading-relaxed">{message.text}</p>
                    <div className={`mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold ${isAssistant ? 'text-slate-500' : 'text-rose-100'}`}>
                      <span>{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isAssistant && message.observationId ? (
                        <>
                          <span>観察研究モードで詳しく見返せます</span>
                          <button
                            type="button"
                            onClick={() => onOpenObservation(message.observationId)}
                            className="rounded-full border border-slate-300 bg-white px-3 py-1 text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
                          >
                            観察で見る
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50/80 p-4 md:p-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
            <textarea
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              placeholder="いま話したいことを、そのまま入力してください"
              className="min-h-[88px] w-full resize-none border-0 bg-transparent text-[15px] font-medium leading-relaxed text-slate-800 outline-none placeholder:text-slate-400"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  handleSend()
                }
              }}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-400">Enter で送信 / Shift + Enter で改行</p>
              <button
                type="button"
                onClick={handleSend}
                disabled={isSending || !inputText.trim()}
                aria-label={isSending ? '返答中' : '送信'}
                className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {isSending ? '返答中...' : '送信'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

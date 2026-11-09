import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, MessageCircle, Send } from 'lucide-react'
import { Avatar } from './ui'
import { byId, roommates } from '../data'
import { useChat } from '../chat'

const clock = (at: number) => new Date(at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

/** The button in the top corner of the app. */
export function ChatButton() {
  const { setOpen, unread } = useChat()
  return (
    <button type="button" className="icon-btn chat-btn" onClick={() => setOpen(true)} aria-label={unread ? `House chat, ${unread} new messages` : 'House chat'}>
      <MessageCircle size={22} aria-hidden />
      {unread > 0 && <span className="chat-count" aria-hidden>{unread}</span>}
    </button>
  )
}

/** The chat itself: a full-height panel over the app. */
export function ChatPanel() {
  const { messages, send, open, setOpen, typing } = useChat()
  const [draft, setDraft] = useState('')
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: 'end' }) }, [open, messages.length, typing])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = draft.trim()
    if (!t) return
    send(t)
    setDraft('')
  }
  return createPortal(
    <div className="chat" role="dialog" aria-modal="true" aria-label="House chat">
      <header className="chat-head">
        <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close chat"><ChevronLeft size={22} aria-hidden /></button>
        <div className="chat-title">
          <b>Casa Girasol</b>
          <small>{roommates.map((r) => (r.id === 'you' ? 'You' : r.name)).join(', ')}</small>
        </div>
        <div className="chat-faces" aria-hidden>{roommates.slice(1).map((r) => <Avatar key={r.id} id={r.id} size={26} />)}</div>
      </header>

      <div className="chat-list">
        {messages.map((m, i) => {
          const mine = m.who === 'you'
          const first = i === 0 || messages[i - 1].who !== m.who
          return (
            <div key={m.id} className={`chat-row${mine ? ' mine' : ''}${first ? ' first' : ''}`}>
              {!mine && <span className="chat-av">{first && <Avatar id={m.who} size={30} />}</span>}
              <div className="chat-col">
                {!mine && first && <small className="chat-name">{byId(m.who).name}</small>}
                <p className="chat-bubble">{m.text}</p>
                <small className="chat-time">{clock(m.at)}</small>
              </div>
            </div>
          )
        })}
        {typing && (
          <div className="chat-row first">
            <span className="chat-av"><Avatar id={typing} size={30} /></span>
            <div className="chat-col"><p className="chat-bubble typing" aria-label={`${byId(typing).name} is typing`}><i /><i /><i /></p></div>
          </div>
        )}
        <div ref={end} />
      </div>

      <form className="chat-form" onSubmit={submit}>
        <input className="input plain" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the house" maxLength={500} aria-label="Message the house" autoFocus />
        <button type="submit" className="chat-send" disabled={!draft.trim()} aria-label="Send"><Send size={20} aria-hidden /></button>
      </form>
    </div>,
    document.body,
  )
}

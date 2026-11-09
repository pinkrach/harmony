import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

/* House chat. Everyone in the house talks in one place. Prototype: messages live in sessionStorage,
   and a roommate answers after a moment so the demo feels alive. */

export type Message = { id: string; who: string; text: string; at: number }

const KEY = 'harmony.chat'
const READ_KEY = 'harmony.chatRead'
const MIN = 60 * 1000

const seed = (): Message[] => {
  const t = Date.now()
  return [
    { id: 'm1', who: 'sofi', text: 'Who’s up for tacos tonight? 🌮', at: t - 95 * MIN },
    { id: 'm2', who: 'diego', text: 'Me! I’ll pick up the tortillas', at: t - 90 * MIN },
    { id: 'm3', who: 'you', text: 'Count me in. I’ll do the dishes after', at: t - 84 * MIN },
    { id: 'm4', who: 'mara', text: 'Can someone take the trash out? It’s getting full 😅', at: t - 12 * MIN },
    { id: 'm5', who: 'sofi', text: 'I’ll do it in a bit!', at: t - 5 * MIN },
  ]
}

function load(): Message[] {
  try {
    const saved = sessionStorage.getItem(KEY)
    if (saved) return JSON.parse(saved) as Message[]
  } catch { /* storage unavailable */ }
  return seed()
}
const save = (m: Message[]) => { try { sessionStorage.setItem(KEY, JSON.stringify(m)) } catch { /* storage unavailable */ } }

const REPLIES: { who: string; text: string }[] = [
  { who: 'sofi', text: 'Sounds good to me 👍' },
  { who: 'diego', text: 'Haha yes 😂' },
  { who: 'mara', text: 'On it!' },
  { who: 'sofi', text: 'Can we talk about it tonight?' },
]

type Store = {
  messages: Message[]
  send: (text: string) => void
  open: boolean
  setOpen: (o: boolean) => void
  unread: number
  typing: string | null
}
const Ctx = createContext<Store | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState(load)
  const [open, setOpenState] = useState(false)
  // Messages from others that arrived after you last had the chat open. Starts with the two newest ones unread.
  const [readAt, setReadAt] = useState<number>(() => {
    try { const v = sessionStorage.getItem(READ_KEY); if (v) return Number(v) } catch { /* storage unavailable */ }
    return load().filter((m) => m.who !== 'you').slice(-2)[0]?.at - 1 || Date.now()
  })
  const [typing, setTyping] = useState<string | null>(null)
  const n = useRef(0)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  const unread = open ? 0 : messages.filter((m) => m.who !== 'you' && m.at > readAt).length
  const setOpen = (o: boolean) => {
    setOpenState(o)
    if (!o) { const t = Date.now(); setReadAt(t); try { sessionStorage.setItem(READ_KEY, String(t)) } catch { /* storage unavailable */ } }
  }
  const commit = (next: Message[]) => { setMessages(next); save(next) }

  const send: Store['send'] = (text) => {
    const msg: Message = { id: `m${Date.now()}`, who: 'you', text, at: Date.now() }
    const base = [...messages, msg]
    commit(base)
    const r = REPLIES[n.current++ % REPLIES.length]
    timers.current.push(window.setTimeout(() => setTyping(r.who), 700))
    timers.current.push(window.setTimeout(() => {
      setTyping(null)
      setMessages((cur) => { const next = [...cur, { id: `m${Date.now()}r`, who: r.who, text: r.text, at: Date.now() }]; save(next); return next })
    }, 2300))
  }
  return <Ctx.Provider value={{ messages, send, open, setOpen, unread, typing }}>{children}</Ctx.Provider>
}

export function useChat() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useChat must be used inside ChatProvider')
  return s
}

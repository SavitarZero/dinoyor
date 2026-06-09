'use client'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/lib/actions/chat'
import type { Message } from '@/lib/types'

interface Props {
  conversationId: string
  initialMessages: Message[]
  currentUserId: string
}

export function ChatWindow({ conversationId, initialMessages, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const incoming = payload.new as Message
        setMessages(prev => {
          if (prev.some(m => m.id === incoming.id)) return prev
          // Own messages are added optimistically — skip realtime echo
          if (incoming.sender_id === currentUserId) return prev
          return [...prev, incoming]
        })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed || sending) return

    setSending(true)
    setBody('')

    // Optimistic update — show immediately without waiting for realtime
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      body: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])

    const result = await sendMessage(conversationId, trimmed)
    if (result?.error) {
      // Rollback on failure
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }

    setSending(false)
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-white text-sm font-semibold">Chat</p>
        <p className="text-gray-600 text-xs">Coordinate delivery with the other party</p>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 p-4 h-72 overflow-y-auto">
        {messages.map(msg => {
          const isSystem = msg.sender_id === null
          const isMe = msg.sender_id === currentUserId

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="max-w-xs rounded-xl bg-background border border-border px-3 py-2 text-center">
                  <p className="text-gray-400 text-xs whitespace-pre-wrap">{msg.body}</p>
                </div>
              </div>
            )
          }

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                isMe
                  ? 'bg-accent text-black rounded-br-sm'
                  : 'bg-background border border-border text-white rounded-bl-sm'
              }`}>
                <p className="text-sm leading-snug">{msg.body}</p>
                <p suppressHydrationWarning className={`text-[10px] mt-1 ${isMe ? 'text-black/50' : 'text-gray-600'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 px-4 py-3 border-t border-border">
        <input
          type="text"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-focus-border/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
        >
          Send
        </button>
      </form>
    </div>
  )
}

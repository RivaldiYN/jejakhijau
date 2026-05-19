import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Send, Leaf, User } from 'lucide-react'

interface Message { role: 'user' | 'coach'; text: string }

const STARTERS = [
  'Bagaimana cara kurangi emisi transportasiku?',
  'Tips hemat karbon untuk hari ini?',
  'Apakah emisi 7 hariku sudah baik?',
]

export default function Coach() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      text: 'Halo! Saya JejakCoach 🌿\n\nSaya akan memberikan saran personal berdasarkan data emisi harianmu — bukan tips generik yang sama untuk semua orang.\n\nApa yang ingin kamu tanyakan?',
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const mutation = useMutation({
    mutationFn: (message: string) =>
      api.post('/coach/chat', { message }).then((r) => r.data),
    onSuccess: (data) => {
      setMessages((m) => [...m, { role: 'coach', text: data.response }])
    },
    onError: () => {
      setMessages((m) => [...m, { role: 'coach', text: 'Maaf, saya sedang tidak bisa merespons. Coba lagi ya!' }])
    },
  })

  function send(text: string) {
    if (!text.trim() || mutation.isPending) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    mutation.mutate(text)
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 7rem)' }}>
      {/* Header */}
      <div className="mb-3 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">🤖 AI Coach</h1>
        <p className="text-gray-500 text-sm mt-0.5">Saran personal berdasarkan data emisimu</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
              msg.role === 'coach' ? 'bg-[#3B6D11]' : 'bg-gray-100'
            }`}>
              {msg.role === 'coach'
                ? <Leaf className="w-3.5 h-3.5 text-white" />
                : <User className="w-3.5 h-3.5 text-gray-500" />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'coach'
                ? 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                : 'bg-[#3B6D11] text-white'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {mutation.isPending && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#3B6D11] flex-shrink-0 flex items-center justify-center">
              <Leaf className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl px-3.5 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Starter suggestions */}
      {messages.length === 1 && (
        <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
          {STARTERS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              className="text-xs bg-[#EAF3DE] border border-[#C0DD97] text-[#3B6D11] px-3 py-1.5 rounded-full hover:bg-[#C0DD97] font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          placeholder="Tanya sesuatu..."
          aria-label="Pesan untuk AI Coach"
          className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:border-[#3B6D11] focus:ring-2 focus:ring-[#EAF3DE] outline-none bg-white"
        />
        <button
          onClick={() => send(input)}
          disabled={mutation.isPending || !input.trim()}
          aria-label="Kirim pesan"
          className="w-10 h-10 bg-[#3B6D11] hover:bg-[#27500A] disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

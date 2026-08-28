'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Leaf, AlertCircle } from 'lucide-react'
import { useLocale } from 'next-intl'

// ─── Types ──────────────────────────────────────────────────────────
interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  timestamp: Date
}

interface HistoryItem {
  role: 'user' | 'model'
  content: string
}

// ─── i18n Content ───────────────────────────────────────────────────
const content = {
  id: {
    title: 'Nila',
    subtitle: 'Asisten Valam',
    placeholder: 'Ketik pertanyaan Anda...',
    welcome: 'Halo! 👋 Saya **Nila**, asisten digital Valam. Saya siap membantu Anda seputar minyak nilam, proses pemesanan, dan layanan platform kami. Ada yang bisa saya bantu?',
    error: 'Maaf, sedang ada gangguan. Silakan coba lagi sebentar.',
    rateLimited: 'Anda terlalu sering mengirim pesan. Silakan tunggu sebentar.',
    typing: 'Nila sedang mengetik',
    greeting: 'Hai! Butuh bantuan seputar nilam? 👋',
    chips: [
      'Harga nilam terkini',
      'Grade minyak nilam',
      'Cara pesan',
      'Proses ekspor',
      'Daftar sebagai supplier',
    ],
  },
  en: {
    title: 'Nila',
    subtitle: 'Valam Assistant',
    placeholder: 'Type your question...',
    welcome: 'Hello! 👋 I\'m **Nila**, Valam\'s digital assistant. I\'m here to help you with patchouli oil, ordering processes, and our platform services. How can I help you?',
    error: 'Sorry, something went wrong. Please try again.',
    rateLimited: 'You\'re sending messages too quickly. Please wait a moment.',
    typing: 'Nila is typing',
    greeting: 'Hi! Need help with patchouli? 👋',
    chips: [
      'Current patchouli prices',
      'Patchouli oil grades',
      'How to order',
      'Export process',
      'Register as supplier',
    ],
  },
}

// ─── Session Storage Key ────────────────────────────────────────────
const STORAGE_KEY = 'valam_nila_chat_history'

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return []
  }
}

function saveHistory(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return
  try {
    // Only store last 50 messages to keep sessionStorage lean
    const toStore = messages.slice(-50)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // sessionStorage full — silently fail
  }
}

// ─── Simple Markdown Renderer ───────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    // Bullet points: lines starting with - or •
    .replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-4 space-y-1 my-1">${match}</ul>`)
    // Numbered lists: lines starting with digits
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n/g, '<br/>')
}

// ─── Component ──────────────────────────────────────────────────────
export function NilaChatWidget() {
  const locale = useLocale() as 'id' | 'en'
  const t = content[locale] || content.id

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [showGreeting, setShowGreeting] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Listen for open event from custom triggers
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true);
    };
    window.addEventListener('valam_open_chat', handleOpenChat);
    return () => window.removeEventListener('valam_open_chat', handleOpenChat);
  }, []);

  // Auto-show greeting bubble after 3 seconds (once per session)
  useEffect(() => {
    const alreadyShown = sessionStorage.getItem('valam_nila_greeted')
    if (alreadyShown || isOpen) return

    const timer = setTimeout(() => {
      setShowGreeting(true)
      sessionStorage.setItem('valam_nila_greeted', '1')
    }, 3000)

    return () => clearTimeout(timer)
  }, [isOpen])

  // Hide greeting when chat is opened
  useEffect(() => {
    if (isOpen) setShowGreeting(false)
  }, [isOpen])

  // Load history from sessionStorage on first open
  useEffect(() => {
    if (isOpen && !hasInitialized) {
      const stored = loadHistory()
      if (stored.length > 0) {
        setMessages(stored)
      } else {
        // Add welcome message
        setMessages([{
          id: 'welcome',
          role: 'model',
          content: t.welcome,
          timestamp: new Date(),
        }])
      }
      setHasInitialized(true)
    }
  }, [isOpen, hasInitialized, t.welcome])

  // Save to sessionStorage whenever messages change
  useEffect(() => {
    if (hasInitialized && messages.length > 0) {
      saveHistory(messages)
    }
  }, [messages, hasInitialized])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  // ── Send Message ──────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      // Build history for API (exclude welcome message, limit to last 10)
      const historyForApi: HistoryItem[] = [...messages, userMessage]
        .filter(m => m.id !== 'welcome')
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api'}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            history: historyForApi.slice(0, -1), // Exclude the current message (it's sent as `message`)
          }),
        },
      )

      if (response.status === 429) {
        setError(t.rateLimited)
        setIsLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        content: data.reply,
        timestamp: new Date(data.timestamp),
      }

      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('[Nila Chat] Error:', err)
      setError(t.error)
    } finally {
      setIsLoading(false)
    }
  }, [messages, isLoading, t.error, t.rateLimited])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleChipClick = (chip: string) => {
    sendMessage(chip)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // Show quick chips only if conversation has 1 or fewer messages (just the welcome)
  // Always show quick reply chips for easy access
  const showChips = true

  return (
    <>
      {/* ── Floating Action Button + Greeting Bubble ────────────── */}
      <AnimatePresence>
        {!isOpen && (
          <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9998] flex items-end gap-3">
            {/* Greeting Bubble - hidden on mobile */}
            <AnimatePresence>
              {showGreeting && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  onClick={() => { setShowGreeting(false); setIsOpen(true) }}
                  className="hidden md:block cursor-pointer bg-white rounded-2xl rounded-br-md shadow-lg shadow-emerald-900/10 border border-zinc-100 px-4 py-3 max-w-[220px] hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-3.5 h-3.5 text-emerald-950" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900">Nila</p>
                      <p className="text-sm text-zinc-700 leading-snug mt-0.5">{t.greeting}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowGreeting(false) }}
                    className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-500 text-xs transition-colors"
                    aria-label="Dismiss"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* FAB Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              onClick={() => setIsOpen(true)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-lg shadow-emerald-900/30 hover:shadow-xl hover:shadow-emerald-900/40 hover:scale-105 transition-all flex items-center justify-center group relative"
              aria-label="Open Nila chat"
            >
              <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
              {/* Pulse indicator */}
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-gold-400 rounded-full border-2 border-white animate-pulse" />
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* ── Chat Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9998] w-[400px] h-[520px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-4rem)] flex flex-col rounded-2xl shadow-2xl shadow-emerald-950/20 border border-zinc-200 bg-white overflow-hidden"
          >
            {/* ── Header ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-md flex-shrink-0">
                <Leaf className="w-5 h-5 text-emerald-950" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif font-bold text-base leading-tight">{t.title}</h3>
                <p className="text-emerald-200/80 text-xs">{t.subtitle}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Messages Area ────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-zinc-50/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                        ? 'bg-emerald-800 text-white rounded-br-md'
                        : 'bg-white text-zinc-800 border border-zinc-100 shadow-sm rounded-bl-md'
                      }`}
                  >
                    <div
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    <p
                      className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-emerald-200/60' : 'text-zinc-400'
                        }`}
                    >
                      {msg.timestamp.toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-zinc-400">{t.typing}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex justify-center">
                  <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Quick Reply Chips ─────────────────────────────────── */}
            {showChips && (
              <div className="px-4 py-2 border-t border-zinc-100 bg-white flex-shrink-0">
                <div className="flex flex-wrap gap-1.5">
                  {t.chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      disabled={isLoading}
                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Input Area ───────────────────────────────────────── */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 px-4 py-3 border-t border-zinc-100 bg-white flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.placeholder}
                maxLength={1000}
                disabled={isLoading}
                className="flex-1 h-10 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 disabled:opacity-50 transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

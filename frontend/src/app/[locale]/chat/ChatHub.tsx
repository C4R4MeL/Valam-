'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Leaf, AlertCircle, Trash2, HelpCircle, ArrowRight, User } from 'lucide-react'
import { useLocale } from 'next-intl'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

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
    subtitle: 'Asisten AI Valam',
    placeholder: 'Ketik pertanyaan Anda di sini...',
    welcome: 'Halo! 👋 Saya **Nila**, asisten digital Valam. Saya siap membantu Anda dengan informasi harga minyak nilam terkini, standar mutu (grade), cara melakukan transaksi, prosedur ekspor, hingga pendaftaran kemitraan koperasi. Apa yang bisa saya bantu hari ini?',
    error: 'Maaf, sedang terjadi kendala teknis. Silakan coba kembali.',
    rateLimited: 'Anda mengirimkan pesan terlalu cepat. Mohon tunggu sesaat.',
    typing: 'Nila sedang mengetik',
    clearConfirm: 'Apakah Anda yakin ingin menghapus semua riwayat percakapan?',
    chips: [
      'Harga nilam terkini',
      'Grade minyak nilam',
      'Cara pesan',
      'Proses ekspor',
      'Daftar sebagai supplier',
    ],
    infoTitle: 'Tentang Nila',
    infoDesc: 'Nila adalah asisten pintar berbasis AI yang dirancang khusus untuk mendampingi pelaku industri minyak nilam di platform Valam. Nila dapat menjawab pertanyaan seputar operasional platform secara instan 24/7.',
    guideTitle: 'Panduan Pertanyaan',
    guideDesc: 'Anda bisa menanyakan berbagai hal seputar ekosistem minyak nilam:',
    guides: [
      'Berapa harga pasaran minyak nilam saat ini?',
      'Bagaimana kriteria kualitas minyak nilam Grade A?',
      'Langkah-langkah mengirimkan minyak ke QC Valam',
      'Bagaimana sistem bagi hasil transaksi circular economy?'
    ]
  },
  en: {
    title: 'Nila',
    subtitle: 'Valam AI Assistant',
    placeholder: 'Type your question here...',
    welcome: 'Hello! 👋 I\'m **Nila**, Valam\'s digital assistant. I\'m here to help you with current patchouli oil prices, quality standards (grades), ordering/transaction steps, export procedures, and cooperative registration. How can I assist you today?',
    error: 'Sorry, something went wrong. Please try again.',
    rateLimited: 'You are sending messages too quickly. Please wait a moment.',
    typing: 'Nila is typing',
    clearConfirm: 'Are you sure you want to clear your entire chat history?',
    chips: [
      'Current patchouli prices',
      'Patchouli oil grades',
      'How to order',
      'Export process',
      'Register as supplier',
    ],
    infoTitle: 'About Nila',
    infoDesc: 'Nila is an AI-powered smart assistant specifically built to assist patchouli oil industry participants on the Valam platform. Nila answers operational and platform questions instantly 24/7.',
    guideTitle: 'Sample Queries',
    guideDesc: 'You can ask about various topics in the patchouli oil ecosystem:',
    guides: [
      'What is the current market price for patchouli oil?',
      'What are the quality specifications for Grade A oil?',
      'How do I submit my oil batches to Valam QC?',
      'How does the revenue-sharing model work for circular economy?'
    ]
  },
}

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
    const toStore = messages.slice(-50)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // silently fail
  }
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
    .replace(/^[•\-]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul class="list-disc pl-4 space-y-1 my-1">${match}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\n/g, '<br/>')
}

export function ChatHub() {
  const locale = useLocale() as 'id' | 'en'
  const t = content[locale] || content.id

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize session chat history
  useEffect(() => {
    const stored = loadHistory()
    if (stored.length > 0) {
      setMessages(stored)
    } else {
      setMessages([{
        id: 'welcome',
        role: 'model',
        content: t.welcome,
        timestamp: new Date(),
      }])
    }
    setHasInitialized(true)
  }, [t.welcome])

  // Save changes to storage
  useEffect(() => {
    if (hasInitialized && messages.length > 0) {
      saveHistory(messages)
    }
  }, [messages, hasInitialized])

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Send message
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
            history: historyForApi.slice(0, -1),
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

  const handleClearHistory = () => {
    if (window.confirm(t.clearConfirm)) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        content: t.welcome,
        timestamp: new Date(),
      }])
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/50 text-zinc-900 font-sans">
      <Navbar />

      {/* Hero Accent Header */}
      <section className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white pt-24 pb-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold-400 via-emerald-900 to-black pointer-events-none" />
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-gold-400/20 text-gold-400 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-gold-400/30">
                AI Assistant
              </span>
            </div>
            <h1 className="font-serif font-bold text-3xl md:text-4xl mt-3 text-white">
              {locale === 'id' ? 'Tanya Nila' : 'Ask Nila'}
            </h1>
            <p className="text-emerald-100/70 text-sm md:text-base mt-2 max-w-xl">
              {locale === 'id' 
                ? 'Konsultasi instan seputar standar mutu minyak nilam, harga pasar terkini, dan panduan platform Valam.'
                : 'Instant consultation on patchouli oil quality standards, current market prices, and Valam guides.'}
            </p>
          </div>
          <button 
            onClick={handleClearHistory}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/20 transition-all self-start md:self-center"
            title="Reset Chat"
          >
            <Trash2 className="w-4 h-4 text-emerald-300" />
            {locale === 'id' ? 'Hapus Riwayat' : 'Clear Chat'}
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI Assistant Info Panel */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* Nila Profile Card */}
          <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/10 flex-shrink-0">
                <Leaf className="w-7 h-7 text-emerald-950" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-emerald-900">{t.title}</h3>
                <p className="text-zinc-400 text-xs font-medium">{t.subtitle}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>

            <hr className="my-5 border-zinc-100" />

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-emerald-700" /> {t.infoTitle}
                </h4>
                <p className="text-zinc-600 text-xs leading-relaxed">{t.infoDesc}</p>
              </div>
            </div>
          </div>

          {/* Quick Guide Card */}
          <div className="bg-gradient-to-br from-[#1A4D2E] to-[#0f2e1b] text-white rounded-2xl p-6 shadow-sm border border-emerald-800/20">
            <h4 className="text-gold-400 text-xs font-bold uppercase tracking-wider mb-2">
              {t.guideTitle}
            </h4>
            <p className="text-emerald-100/70 text-xs mb-4">
              {t.guideDesc}
            </p>
            <div className="space-y-3">
              {t.guides.map((guide, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(guide)}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs flex items-start gap-2.5 group"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-gold-400 mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-emerald-50 leading-snug">{guide}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Column: Main Chat Window */}
        <section className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden h-[620px] relative">
          
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold ${
                    msg.role === 'user' 
                      ? 'bg-zinc-100 text-zinc-700' 
                      : 'bg-gradient-to-br from-gold-400 to-gold-600 text-emerald-950'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                      ? 'bg-emerald-800 text-white rounded-tr-none'
                      : 'bg-white text-zinc-800 border border-zinc-100 rounded-tl-none'
                    }`}
                  >
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                    <p
                      className={`text-[9px] mt-2 text-right ${msg.role === 'user' ? 'text-emerald-200/60' : 'text-zinc-400'}`}
                    >
                      {msg.timestamp.toLocaleTimeString(locale, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                </div>
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 items-start max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-4 h-4 text-emerald-950" />
                  </div>
                  <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl rounded-tl-none px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-zinc-400 font-medium">{t.typing}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm text-red-700 shadow-sm">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 text-red-500" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Suggested Chips */}
          <div className="px-6 py-3 border-t border-zinc-100 bg-white flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {t.chips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleChipClick(chip)}
                  disabled={isLoading}
                  className="px-3.5 py-2 text-xs font-semibold rounded-full border border-emerald-200/60 bg-emerald-50/40 text-emerald-800 hover:bg-emerald-100/50 hover:border-emerald-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Form Area */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3 px-6 py-4 border-t border-zinc-150 bg-white flex-shrink-0"
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
              className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-5 h-11 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-950 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:from-emerald-900 hover:to-black disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-900/10"
              aria-label="Send message"
            >
              <span>{locale === 'id' ? 'Kirim' : 'Send'}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </section>
      </main>

      <Footer />
    </div>
  )
}

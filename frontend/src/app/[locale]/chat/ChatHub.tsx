'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Leaf, AlertCircle, Trash2, HelpCircle, ArrowRight, User, Sparkles, Info } from 'lucide-react'
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

function formatTime(date: Date): string {
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '04:12 PM'
  }
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
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-zinc-900 font-sans selection:bg-[#1A4D2E]/10 selection:text-[#1A4D2E]">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-16">
        <div className="max-w-[1140px] w-full mx-auto px-4 sm:px-6">
          
          {/* ─── 2. PAGE INTRODUCTION / COMPACT HERO ─── */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h1 className="font-serif font-bold text-2xl md:text-3xl text-zinc-900 tracking-tight">
                {locale === 'id' ? 'Tanya Nila' : 'Ask Nila'}
              </h1>
              <p className="text-zinc-600 text-xs sm:text-sm mt-1.5 max-w-2xl leading-relaxed">
                {locale === 'id' 
                  ? 'Konsultasi instan seputar standar mutu minyak nilam, harga pasar terkini, dan panduan platform Valam.'
                  : 'Instant consultation on patchouli oil quality standards, current market prices, and Valam guides.'}
              </p>
            </div>
            
            <button 
              onClick={handleClearHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-xs transition-all self-start sm:self-auto cursor-pointer active:scale-95"
              title={locale === 'id' ? 'Hapus Riwayat Percakapan' : 'Clear Chat History'}
            >
              <Trash2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>{locale === 'id' ? 'Hapus Riwayat' : 'Clear Chat'}</span>
            </button>
          </div>

          {/* ─── 3. MAIN WORKSPACE (2 COLUMNS) ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
            
            {/* ─── LEFT COLUMN: SIDEBAR ─── */}
            <aside className="space-y-5">
              
              {/* 4. Nila Profile Card */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs p-5 md:p-6 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1A4D2E] to-[#123320] flex items-center justify-center shadow-xs text-white shrink-0">
                    <Leaf className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-zinc-900 leading-snug">{t.title}</h3>
                    <p className="text-zinc-500 text-xs font-medium">{t.subtitle}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-[#1A4D2E] font-bold uppercase tracking-wider">Online</span>
                    </div>
                  </div>
                </div>

                <hr className="my-4 border-zinc-100" />

                <div>
                  <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Info className="w-3.5 h-3.5 text-[#1A4D2E]" />
                    <span>{t.infoTitle}</span>
                  </h4>
                  <p className="text-zinc-600 text-xs leading-relaxed">{t.infoDesc}</p>
                </div>
              </div>

              {/* 5. Sample Queries Card */}
              <div className="bg-[#1A4D2E] text-white rounded-2xl p-5 md:p-6 shadow-sm border border-[#143D24]">
                <h4 className="text-amber-300 text-xs font-bold uppercase tracking-wider mb-1.5">
                  {t.guideTitle}
                </h4>
                <p className="text-emerald-100/75 text-xs mb-4 leading-relaxed">
                  {t.guideDesc}
                </p>
                <div className="space-y-2.5">
                  {t.guides.map((guide, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(guide)}
                      disabled={isLoading}
                      className="w-full text-left p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all text-xs flex items-start gap-2.5 group cursor-pointer active:scale-[0.99] disabled:opacity-50"
                    >
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300 mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      <span className="text-emerald-50 group-hover:text-white leading-snug">{guide}</span>
                    </button>
                  ))}
                </div>
              </div>

            </aside>

            {/* ─── RIGHT COLUMN: CHAT PANEL ─── */}
            <section className="bg-white rounded-2xl border border-zinc-200/90 shadow-xs flex flex-col min-h-[620px] h-[660px] overflow-hidden">
              
              {/* 7 & 8. Conversation Area */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 bg-zinc-50/25">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[88%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shrink-0 font-bold shadow-xs ${
                          isUser 
                            ? 'bg-zinc-200 text-zinc-700' 
                            : 'bg-[#1A4D2E] text-white'
                        }`}>
                          {isUser ? <User className="w-4 h-4" /> : <Leaf className="w-4 h-4 text-amber-300" />}
                        </div>

                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-[#1A4D2E] text-white rounded-tr-none'
                              : 'bg-white text-zinc-800 border border-zinc-200/70 rounded-tl-none'
                          }`}
                        >
                          <div
                            className={`prose prose-sm max-w-none ${isUser ? 'prose-invert text-white' : 'text-zinc-800'}`}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                          <p
                            className={`text-[10px] mt-1.5 text-right font-medium ${
                              isUser ? 'text-emerald-200/70' : 'text-zinc-400'
                            }`}
                          >
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>

                      </div>
                    </div>
                  )
                })}

                {/* Loading / Typing Indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 items-start max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-[#1A4D2E] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Leaf className="w-4 h-4 text-amber-300" />
                      </div>
                      <div className="bg-white border border-zinc-200/70 shadow-xs rounded-2xl rounded-tl-none px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#1A4D2E] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#1A4D2E] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#1A4D2E] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs text-red-700 shadow-xs">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* 9. Quick Actions */}
              <div className="px-5 py-3 border-t border-zinc-100 bg-white shrink-0">
                <div className="flex flex-wrap gap-2">
                  {t.chips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-[#1A4D2E]/5 hover:border-[#1A4D2E]/30 hover:text-[#1A4D2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* 10. Chat Input */}
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2.5 px-5 py-3.5 border-t border-zinc-100 bg-white shrink-0"
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
                  className="flex-1 h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#1A4D2E]/15 focus:border-[#1A4D2E] focus:bg-white disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="h-11 px-5 rounded-xl bg-[#1A4D2E] hover:bg-[#123320] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-[#1A4D2E]/20 active:scale-[0.98] cursor-pointer"
                  aria-label="Send message"
                >
                  <span>{locale === 'id' ? 'Kirim' : 'Send'}</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

            </section>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}

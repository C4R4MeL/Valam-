'use client'

import { usePathname } from 'next/navigation'
import { NilaChatWidget } from './NilaChatWidget'

/** Floating Ask Nila chatbot — hidden on the full /chat page. */
export function NilaChatMount() {
  const pathname = usePathname()
  const onChatPage = /\/chat\/?$/.test(pathname || '')

  if (onChatPage) return null

  return <NilaChatWidget />
}

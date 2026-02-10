"use client"

import type React from "react"
import { Analytics } from "@vercel/analytics/next"
import { useState, useEffect } from "react"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from system preference or localStorage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem("ruleguard-theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    if (saved) {
      setIsDark(saved === "dark")
    } else {
      setIsDark(prefersDark)
    }
  }, [])

  // Apply theme to document
  useEffect(() => {
    if (mounted) {
      const html = document.documentElement
      if (isDark) {
        html.classList.add("dark")
      } else {
        html.classList.remove("dark")
      }
      localStorage.setItem("ruleguard-theme", isDark ? "dark" : "light")
    }
  }, [isDark, mounted])

  const toggleTheme = () => setIsDark(!isDark)

  if (!mounted) return null

  return (
    <>
      {children}
      <Analytics />
    </>
  )
}

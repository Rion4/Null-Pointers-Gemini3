"use client"

import { useState } from "react"
import { Navigation } from "@/components/navigation"
import { Hero } from "@/components/hero"
import { BrowserDemo } from "@/components/browser-demo"
import { Features } from "@/components/features"
import { Pricing } from "@/components/pricing"
import { Demo } from "@/components/demo"
import { Docs } from "@/components/docs"
import { Footer } from "@/components/footer"

export default function Home() {
  const [currentSection, setCurrentSection] = useState("home")

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation currentSection={currentSection} setCurrentSection={setCurrentSection} />

      {currentSection === "home" && (
        <>
          <Hero setCurrentSection={setCurrentSection} />
          <BrowserDemo />
          <Features />
        </>
      )}

      {currentSection === "demo" && <Demo />}

      {currentSection === "pricing" && <Pricing />}

      {currentSection === "docs" && <Docs />}

      <Footer />
    </div>
  )
}

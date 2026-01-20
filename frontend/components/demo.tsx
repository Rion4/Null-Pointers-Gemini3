"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Zap, Brain, Upload, FileText } from "lucide-react"

interface DemoScenario {
  id: string
  title: string
  description: string
  input: string
  detectedPersonas: string[]
  output: string[]
  guidance: string
}

const personas = {
  lawyer: { name: "Legal Counsel", icon: "⚖️", color: "bg-blue-500/10 text-blue-400" },
  ca: { name: "Chartered Accountant", icon: "📊", color: "bg-emerald-500/10 text-emerald-400" },
  financial: { name: "Financial Advisor", icon: "💰", color: "bg-purple-500/10 text-purple-400" },
  compliance: { name: "Compliance Officer", icon: "✓", color: "bg-cyan-500/10 text-cyan-400" },
  tax: { name: "Tax Specialist", icon: "🏛️", color: "bg-orange-500/10 text-orange-400" },
  international: { name: "International Relations", icon: "🌍", color: "bg-pink-500/10 text-pink-400" },
  auditor: { name: "Auditor", icon: "🔍", color: "bg-indigo-500/10 text-indigo-400" },
  strategist: { name: "Business Strategist", icon: "📈", color: "bg-teal-500/10 text-teal-400" },
}

const scenarios: DemoScenario[] = [
  {
    id: "1",
    title: "Cross-Border M&A Transaction",
    description: "Analyzing a $50M acquisition with legal, tax, and compliance implications",
    input:
      "International merger between US tech company and EU fintech startup with complex IP and data transfer requirements",
    detectedPersonas: ["lawyer", "tax", "international", "compliance"],
    output: [
      "✓ Due diligence checklist: 94% complete",
      "⚠ Data transfer agreement requires GDPR addendum",
      "✓ Tax treaty analysis shows 15% withholding optimization",
      "→ Regulatory approval needed in 3 jurisdictions",
    ],
    guidance:
      "Engage local counsel in target jurisdiction. Prioritize data transfer agreements and regulatory filings. Tax structuring can be optimized through treaty provisions.",
  },
  {
    id: "2",
    title: "Financial Statement Review",
    description: "Quarterly financial audit with regulatory compliance verification",
    input: "Q4 2024 consolidated financial statements with revenue recognition changes and reserve adjustments",
    detectedPersonas: ["ca", "auditor", "compliance", "financial"],
    output: [
      "✓ Revenue recognition: Compliant with IFRS 15",
      "⚠ Reserve levels below regulatory minimum - action required",
      "✓ Internal controls testing: 98% effective",
      "→ Audit recommendation: Strengthen Q1 reserve provisions",
    ],
    guidance:
      "Immediately address reserve deficiency through capital allocation or operational adjustments. Implement recommended internal control enhancements before next audit cycle.",
  },
  {
    id: "3",
    title: "Regulatory Compliance Audit",
    description: "Multi-jurisdiction compliance assessment across operations",
    input: "Annual compliance review covering AML/KYC, sanctions screening, and data privacy across 12 jurisdictions",
    detectedPersonas: ["compliance", "lawyer", "international", "strategist"],
    output: [
      "✓ AML/KYC framework: Fully implemented",
      "✓ Sanctions screening: 100% coverage maintained",
      "⚠ GDPR compliance gap identified in 2 EU markets",
      "→ Emerging regulations in Singapore require proactive adaptation",
    ],
    guidance:
      "Prioritize GDPR remediation in identified markets. Establish monitoring for Singapore regulation changes. Update KYC procedures to accommodate new beneficial ownership requirements.",
  },
  {
    id: "4",
    title: "Tax Planning Strategy",
    description: "Corporate restructuring with international tax optimization",
    input: "Planned group reorganization involving subsidiary consolidation and IP migration across jurisdictions",
    detectedPersonas: ["tax", "international", "strategist", "lawyer"],
    output: [
      "✓ Transfer pricing study completed: Safe harbor status available",
      "✓ Restructuring has 68% tax efficiency gain potential",
      "⚠ Anti-BEPS compliance requires advance pricing agreement",
      "→ Timing optimization: Execute within Q2 for maximum benefit",
    ],
    guidance:
      "File APAs with relevant tax authorities before restructuring. Document transfer pricing methodology comprehensively. Consider phased implementation to minimize risk.",
  },
]

export function Demo() {
  const [selectedScenario, setSelectedScenario] = useState<DemoScenario>(scenarios[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [textInput, setTextInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRunDemo = async () => {
    setIsProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsProcessing(false)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-3xl font-bold sm:text-4xl">Interactive Demos</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            See how RuleGuard's unified AI agent with 8 specialized personas handles complex scenarios
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Scenario Selector */}
          <div className="space-y-3 lg:col-span-1">
            <h3 className="text-sm font-semibold text-muted-foreground">SCENARIOS</h3>
            {scenarios.map((scenario, idx) => (
              <Card
                key={scenario.id}
                className={`cursor-pointer transition-all p-4 animate-slide-in ${
                  selectedScenario.id === scenario.id
                    ? "border-primary bg-primary/5 shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => setSelectedScenario(scenario)}
              >
                <h4 className="font-semibold text-sm">{scenario.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{scenario.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {scenario.detectedPersonas.slice(0, 2).map((p) => (
                    <span
                      key={p}
                      className={`text-xs px-2 py-1 rounded-full ${personas[p as keyof typeof personas].color}`}
                    >
                      {personas[p as keyof typeof personas].icon}
                    </span>
                  ))}
                  {scenario.detectedPersonas.length > 2 && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                      +{scenario.detectedPersonas.length - 2}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* Demo Viewer */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border p-6 space-y-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Upload Your Document or Paste Text</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Document */}
                <div
                  className="border-2 border-dashed border-primary/30 rounded-lg p-6 hover:border-primary/60 transition-colors cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    aria-label="Upload document"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-6 w-6 text-primary/60 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">
                      {uploadedFile ? "✓ Document uploaded" : "Upload Document"}
                    </span>
                    <span className="text-xs text-muted-foreground">PDF, DOC, or TXT</span>
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex flex-col gap-2">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Or paste your content here..."
                    className="flex-1 bg-background/50 border border-border rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[120px]"
                  />
                </div>
              </div>
            </Card>

            <Card className="border-border p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedScenario.title}</h2>
                <p className="text-muted-foreground mt-2">{selectedScenario.description}</p>
              </div>

              {/* Detected Personas */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  AUTOMATICALLY DETECTED PERSONAS
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedScenario.detectedPersonas.map((p) => {
                    const persona = personas[p as keyof typeof personas]
                    return (
                      <div
                        key={p}
                        className={`px-3 py-2 rounded-lg text-xs font-medium ${persona.color} border border-current/20`}
                      >
                        {persona.icon} {persona.name}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Input Section */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold">INPUT</h3>
                <div className="bg-card rounded-lg p-4 border border-border text-sm">
                  <code className="text-accent">{selectedScenario.input}</code>
                </div>
              </div>

              {/* Processing Button */}
              <Button
                onClick={handleRunDemo}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {isProcessing ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    Analyzing with All Personas...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Run Multi-Persona Analysis
                  </>
                )}
              </Button>
            </Card>

            {/* Output Section */}
            <Card className="border-border p-6 space-y-4">
              <h3 className="text-sm font-semibold">UNIFIED AI AGENT ANALYSIS</h3>
              <div className="space-y-3">
                {selectedScenario.output.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 text-sm animate-fade-in-up"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    {item.includes("✓") ? (
                      <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    ) : item.includes("⚠") ? (
                      <AlertCircle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/20 flex-shrink-0 mt-0.5" />
                    )}
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Guidance Section */}
              <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <h4 className="text-sm font-semibold text-primary mb-2">RECOMMENDED ACTION</h4>
                <p className="text-sm text-foreground">{selectedScenario.guidance}</p>
              </div>

              {/* AI Agent Integration Placeholder */}
              <div className="mt-6 p-4 rounded-lg bg-card border border-border">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">SYSTEM INFO</h4>
                <code className="text-xs text-muted-foreground block font-mono space-y-1">
                  <div>{`// Unified AI Agent powered by Gemini 2.0 Flash`}</div>
                  <div>{`// Active Personas: ${selectedScenario.detectedPersonas.length}`}</div>
                  <div>{`// Reasoning Mode: Multi-turn Chain-of-Thought`}</div>
                  <div>{`// Context Window: Jurisdiction-aware, Real-time Rules`}</div>
                </code>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}

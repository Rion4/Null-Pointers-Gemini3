"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Code2, Brain } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Docs() {
  const [selectedTab, setSelectedTab] = useState("quickstart")

  const personas = [
    {
      name: "Legal Counsel",
      icon: "⚖️",
      description: "Expert in contract analysis, regulatory compliance, and legal risk assessment",
      specialties: ["Contract Review", "Compliance", "Risk Analysis", "Regulatory Interpretation"],
    },
    {
      name: "Chartered Accountant",
      icon: "📊",
      description: "Financial reporting, tax compliance, and accounting standards expertise",
      specialties: ["Financial Analysis", "Tax Planning", "Audit Readiness", "GAAP/IFRS Compliance"],
    },
    {
      name: "Financial Advisor",
      icon: "💰",
      description: "Investment strategies, portfolio analysis, and financial planning",
      specialties: ["Investment Analysis", "Risk Management", "Financial Planning", "Market Insights"],
    },
    {
      name: "Compliance Officer",
      icon: "✅",
      description: "Regulatory requirements, compliance frameworks, and audit trails",
      specialties: ["Regulatory Compliance", "Policy Enforcement", "Audit Trails", "Risk Mitigation"],
    },
    {
      name: "Tax Specialist",
      icon: "🏛️",
      description: "Tax law interpretation, optimization strategies, and filing requirements",
      specialties: ["Tax Optimization", "Compliance Filing", "Deduction Analysis", "Cross-border Tax"],
    },
    {
      name: "International Relations",
      icon: "🌍",
      description: "Cross-border regulations, international agreements, and geopolitical context",
      specialties: ["Global Compliance", "International Contracts", "Trade Regulations", "Sanctions"],
    },
    {
      name: "Auditor",
      icon: "🔍",
      description: "Financial verification, control assessment, and transparency validation",
      specialties: ["Internal Controls", "Audit Procedures", "Financial Verification", "Fraud Detection"],
    },
    {
      name: "Business Strategist",
      icon: "🎯",
      description: "Business impact analysis, strategic planning, and operational efficiency",
      specialties: ["Business Impact", "Strategic Planning", "Operational Analysis", "Growth Strategy"],
    },
  ]

  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12">
          <h1 className="text-3xl font-bold sm:text-4xl">Documentation</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to integrate RuleGuard&apos;s multi-persona AI agent into your application
          </p>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
            <TabsTrigger value="personas">Personas</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>

          {/* Quick Start */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card className="border-border p-6 bg-cool-gradient">
              <h2 className="text-2xl font-bold mb-4">Getting Started</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      1
                    </span>
                    Install the SDK
                  </h3>
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <code className="text-sm text-accent font-mono">{`npm install @ruleguard/sdk @ai-sdk/google`}</code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      2
                    </span>
                    Initialize the Multi-Persona Agent
                  </h3>
                  <div className="bg-card rounded-lg p-4 border border-border overflow-auto">
                    <code className="text-sm text-accent font-mono text-balance">
                      {`import { RuleGuardClient } from '@ruleguard/sdk'

const client = new RuleGuardClient({
  apiKey: process.env.RULEGUARD_API_KEY,
  model: 'gemini-2.0-flash',
  personas: ['legal', 'accountant', 'advisor', 'compliance', 'tax', 'international', 'auditor', 'strategist'],
  autoDetectPersona: true, // Automatically select personas based on input
})

export default client`}
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      3
                    </span>
                    Analyze Content with Automatic Persona Selection
                  </h3>
                  <div className="bg-card rounded-lg p-4 border border-border overflow-auto">
                    <code className="text-sm text-accent font-mono">
                      {`import client from '@/lib/ruleguard'

// Single API call - personas auto-detected based on content
const analyze = async (content: string) => {
  // TODO: Integrate with Gemini 2.0 Flash model
  const response = await client.agents.analyze({
    content: content,
    autoDetectPersona: true, // Agent determines needed personas
  })
  
  return {
    selectedPersonas: response.personas, // Which personas analyzed this
    analysis: response.analysis,
    recommendations: response.recommendations,
  }
}`}
                    </code>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Personas */}
          <TabsContent value="personas" className="space-y-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-4">Multi-Persona Agent System</h2>
              <p className="text-muted-foreground mb-6">
                RuleGuard uses a single AI agent with 8 specialized personas. The system automatically detects which
                personas are most relevant for your content and applies their expertise to deliver comprehensive
                analysis.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {personas.map((persona) => (
                <Card key={persona.name} className="border-cool-glow p-6 hover:border-primary/50 transition-colors">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-3xl">{persona.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold">{persona.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{persona.description}</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">SPECIALTIES</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.specialties.map((specialty) => (
                        <span key={specialty} className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="border-primary/50 bg-primary/5 p-6 mt-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Automatic Persona Detection
              </h3>
              <p className="text-muted-foreground mb-4">
                The agent analyzes your input content and automatically selects the 1-8 most relevant personas based on
                keywords, context, and document type. This ensures you get expert analysis from only the necessary
                perspectives.
              </p>
              <div className="bg-card rounded p-3 border border-border text-xs">
                <code className="text-accent font-mono">
                  {`// Example: Submit a contract with cross-border tax implications
const response = await client.agents.analyze({
  content: contractText,
  autoDetectPersona: true,
})

// Response might include:
// personas: ['Legal Counsel', 'Tax Specialist', 'International Relations', 'Compliance Officer']`}
                </code>
              </div>
            </Card>
          </TabsContent>

          {/* API Reference */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border-border p-6 bg-cool-gradient space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-3">Agent Configuration</h3>
                <div className="bg-card rounded-lg p-4 border border-border overflow-auto">
                  <code className="text-sm text-accent font-mono">
                    {`interface AgentConfig {
  // Core settings
  apiKey: string
  model: 'gemini-2.0-flash' | 'gemini-1.5-pro'
  
  // Personas configuration
  personas: ['legal' | 'accountant' | 'advisor' | 'compliance' | 'tax' | 'international' | 'auditor' | 'strategist'][]
  autoDetectPersona: boolean // Auto-select relevant personas
  
  // Analysis settings
  temperature?: number // 0.0 - 1.0, default: 0.3
  maxTokens?: number
  
  // Callback handlers - TODO: Implement
  onAnalysisStart?: () => void
  onPersonaSelected?: (personas: string[]) => void
  onAnalysisComplete?: (result: any) => void
  onError?: (error: Error) => void
}`}
                  </code>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold mb-3">Core Methods</h3>
                <div className="space-y-4">
                  <div className="bg-card rounded p-4 border border-border">
                    <code className="text-sm text-accent font-mono">
                      {`// Analyze with automatic persona detection
client.agents.analyze(config): Promise<AnalysisResult>

// Returns: { personas: string[], analysis: object, confidence: number }`}
                    </code>
                  </div>
                  <div className="bg-card rounded p-4 border border-border">
                    <code className="text-sm text-accent font-mono">
                      {`// Validate with specific persona set
client.agents.validate(content, personas, rules): Promise<ValidationResult>

// TODO: Implement batch validation
client.agents.validateBatch(items[]): Promise<ValidationResult[]>`}
                    </code>
                  </div>
                  <div className="bg-card rounded p-4 border border-border">
                    <code className="text-sm text-accent font-mono">
                      {`// Get guidance recommendations
client.agents.getGuidance(context): Promise<Guidance[]>

// TODO: Implement guidance history
client.agents.getGuidanceHistory(id): Promise<Guidance[]>`}
                    </code>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Status */}
        <Card className="border-primary/50 bg-primary/5 p-6 mt-12">
          <div className="flex items-start gap-4">
            <Code2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold mb-2">Ready to Integrate?</h3>
              <p className="text-muted-foreground mb-4">
                RuleGuard&apos;s unified agent with 8 personas provides comprehensive analysis through a single API
                endpoint. All code examples include TODO comments marking integration points.
              </p>
              <div className="flex gap-3 text-sm flex-wrap">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary">Persona Detection</span>
                <span className="px-3 py-1 rounded-full bg-accent/20 text-accent">Multi-Analysis</span>
                <span className="px-3 py-1 rounded-full bg-success/20 text-success">Single API Call</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}

import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const tiers = [
  {
    name: "Analyst",
    tagline: "Multi-Document Analysis",
    price: "Free",
    description: "Perfect for exploring complex documents",
    features: [
      "Upload up to 10 documents/month",
      "All 8 AI personas included",
      "Risk analysis & red flag detection",
      "Persona interaction logs",
      "Email support",
      "Basic API access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    tagline: "Real-time Guidance + Workspace",
    price: "$49",
    period: "/month",
    description: "For professionals handling complex decisions daily",
    features: [
      "All Analyst features",
      "Unlimited documents",
      "Browser extension with sidebar",
      "Real-time persona recommendations",
      "Multi-team workspace",
      "Audit trails & compliance logs",
      "Priority support",
      "Advanced API access",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    tagline: "Custom Personas + Human Review",
    price: "Custom",
    description: "For organizations with specialized needs",
    features: [
      "All Professional features",
      "Custom persona training",
      "Human expert verification available",
      "White-label options",
      "Dedicated account manager",
      "SLA & uptime guarantees",
      "24/7 phone & chat support",
      "Custom integrations",
      "On-premise deployment available",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center animate-fade-in-up">
          <h2 className="text-4xl font-bold mb-4">Transparent Multi-Persona Pricing</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            All tiers include access to all 8 AI personas. Scale up as your needs grow.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-6">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`rounded-lg border p-8 flex flex-col transition-all duration-300 animate-slide-in hover:shadow-lg ${
                tier.highlighted
                  ? "border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 relative ring-1 ring-primary/30"
                  : "border-border bg-card"
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-block rounded-full bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold animate-glow">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-sm text-primary font-medium">{tier.tagline}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && <span className="text-muted-foreground">{tier.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
              </div>

              <Button
                className={`w-full mb-8 transition-all ${
                  tier.highlighted
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    : "border border-primary/50 text-primary hover:bg-primary/5"
                }`}
                variant={tier.highlighted ? "default" : "outline"}
              >
                {tier.cta}
              </Button>

              <div className="space-y-3">
                {tier.features.map((feature, j) => (
                  <div key={j} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-lg border border-border bg-muted/20 p-8 text-center animate-fade-in-up">
          <p className="text-sm text-muted-foreground mb-3">Questions about personas or integration?</p>
          <p className="text-lg font-semibold mb-4">Our team is ready to help you maximize RuleGuard's potential.</p>
          <Button variant="outline">Schedule a Demo</Button>
        </div>
      </div>
    </section>
  )
}

import { FileUp, Zap, Lock, BarChart3 } from "lucide-react"

const features = [
  {
    icon: FileUp,
    title: "Intelligent Document Analysis",
    description: "Upload contracts, leases, or tax documents. Get instant risk identification and red flag analysis.",
  },
  {
    icon: Zap,
    title: "Real-time Browser Guidance",
    description: "Live sidebar overlay provides next-action recommendations while you work on external websites.",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-level encryption, zero data training, and guaranteed privacy for sensitive documents.",
  },
  {
    icon: BarChart3,
    title: "Multi-Persona Intelligence",
    description: "Legal, financial, regulatory, and more personas collaborate to provide comprehensive guidance.",
  },
]

export function Features() {
  return (
    <section className="px-4 py-24 sm:py-32 lg:px-8 border-t border-border">
      <div className="mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          {features.map((feature, i) => (
            <div
              key={i}
              className="flex flex-col p-6 rounded-xl glass-card hover:border-primary/30 transition-all duration-300"
            >
              <div className="mb-4">
                <div className="inline-flex rounded-lg bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

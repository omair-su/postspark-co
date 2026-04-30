import { motion } from "framer-motion";
import { MessageCircle, Briefcase, Mail, Video } from "lucide-react";

const features = [
  { icon: MessageCircle, title: "10 Tweets", desc: "Short, punchy tweets optimized for engagement and virality." },
  { icon: Briefcase, title: "5 LinkedIn Posts", desc: "Professional, thought-leadership posts that build authority." },
  { icon: Mail, title: "1 Email Newsletter", desc: "Complete newsletter with subject line and engaging body." },
  { icon: Video, title: "1 Video Script", desc: "Hook, main points, and CTA for compelling video content." },
];

export function FeaturesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          Everything You Need, <span className="text-gradient">Instantly</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          One input generates all the content formats you need for a full week of posting.
        </p>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-electric">
                <f.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

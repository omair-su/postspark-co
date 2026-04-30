import { motion } from "framer-motion";
import { FileText, ArrowRight, MessageCircle, Briefcase, Mail, Video } from "lucide-react";

const outputs = [
  { icon: MessageCircle, label: "10 Tweets", color: "text-chart-1" },
  { icon: Briefcase, label: "5 LinkedIn Posts", color: "text-chart-2" },
  { icon: Mail, label: "1 Email Newsletter", color: "text-chart-4" },
  { icon: Video, label: "1 Video Script", color: "text-chart-5" },
];

export function BeforeAfterSection() {
  return (
    <section className="py-20 bg-surface">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-3xl font-bold text-foreground sm:text-4xl">
          One Input. <span className="text-gradient">Infinite Content.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          See how one blog post transforms into a full content library.
        </p>

        <div className="mt-14 flex flex-col items-center gap-6 md:flex-row md:justify-center">
          <motion.div
            className="w-full max-w-[240px] rounded-xl border border-border bg-card p-6 text-center shadow-sm"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <FileText className="mx-auto h-10 w-10 text-primary" />
            <p className="mt-3 text-sm font-semibold text-foreground">Your Blog Post</p>
            <p className="mt-1 text-xs text-muted-foreground">1 piece of content</p>
          </motion.div>

          <ArrowRight className="hidden h-6 w-6 text-muted-foreground md:block" />
          <div className="block text-muted-foreground md:hidden">↓</div>

          <div className="grid w-full max-w-md grid-cols-2 gap-3">
            {outputs.map((item, i) => (
              <motion.div
                key={item.label}
                className="rounded-xl border border-border bg-card p-4 text-center shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <item.icon className={`mx-auto h-6 w-6 ${item.color}`} />
                <p className="mt-2 text-xs font-semibold text-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title?: string;
  subtitle?: string;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
  delay?: number;
}

export function Panel({ title, subtitle, badge, className, children, delay = 0 }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn("glass rounded-xl overflow-hidden", className)}
    >
      {(title || badge) && (
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <div className="flex flex-col leading-tight">
            {title && (
              <h3 className="text-display text-[13px] font-semibold uppercase tracking-wider text-foreground/90">
                {title}
              </h3>
            )}
            {subtitle && (
              <span className="text-mono text-[10px] uppercase text-muted-foreground">
                {subtitle}
              </span>
            )}
          </div>
          {badge}
        </header>
      )}
      <div className="p-4">{children}</div>
    </motion.section>
  );
}

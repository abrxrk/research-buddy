"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/** Fades/slides children in the first time they scroll into view. Also triggers `.highlight` sweeps inside. */
export function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "span" }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as React.Ref<never>} className={cn("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

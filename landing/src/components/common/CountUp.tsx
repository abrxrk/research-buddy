"use client";

import { useEffect, useRef, useState } from "react";

/** Counts from 0 to `to` the first time it scrolls into view. */
export function CountUp({ to, decimals = 0, ms = 1400 }: { to: number; decimals?: number; ms?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now - start) / ms, 1);
        setValue(to * (1 - Math.pow(1 - t, 3)));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
    io.observe(ref.current!);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, ms]);
  return <span ref={ref}>{value.toFixed(decimals)}</span>;
}

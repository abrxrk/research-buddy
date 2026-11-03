"use client";

import { useEffect, useState } from "react";

import { Tip } from "@/components/ui/tooltip";
import { absoluteDate, parseDate, timeAgo } from "@/helpers/format";

type Props = React.ComponentProps<"time"> & {
  iso: string;
  /** Text before the time, e.g. "Added" -> "Added 3 hours ago". */
  prefix?: string;
};

/** Relative time ("3 hours ago") that re-renders every minute and shows the absolute date on hover. */
export function TimeAgo({ iso, prefix, ...props }: Props) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);
  return (
    <Tip content={absoluteDate(iso)}>
      <time dateTime={parseDate(iso).toISOString()} {...props}>
        {prefix ? `${prefix} ` : ""}
        {timeAgo(iso)}
      </time>
    </Tip>
  );
}

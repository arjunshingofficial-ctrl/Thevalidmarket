"use client";

import { useEffect, useState } from "react";

interface ClientDateTimeProps {
  date: string | Date;
  format?: "compact" | "full" | "stacked" | "date-only" | "time-only";
  showSeconds?: boolean;
  className?: string;
}

export default function ClientDateTime({
  date,
  format = "compact",
  showSeconds = false,
  className = "",
}: ClientDateTimeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!date) return <span className={className}>N/A</span>;
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return <span className={className}>Invalid Date</span>;

  // Initial SSR fallback (safe UTC fallback with suppressHydrationWarning)
  if (!mounted) {
    const fallbackDate = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
    const fallbackTime = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "UTC",
    });

    if (format === "stacked") {
      return (
        <div className={`flex flex-col ${className}`} suppressHydrationWarning>
          <span className="font-medium text-slate-700">{fallbackDate}</span>
          <span className="text-[11px] text-slate-400">{fallbackTime}</span>
        </div>
      );
    }

    if (format === "date-only") {
      return <span className={className} suppressHydrationWarning>{fallbackDate}</span>;
    }

    if (format === "time-only") {
      return <span className={className} suppressHydrationWarning>{fallbackTime}</span>;
    }

    return (
      <span className={className} suppressHydrationWarning>
        {fallbackDate}, {fallbackTime}
      </span>
    );
  }

  // Client-side rendering in User's Local Browser Timezone
  const localDate = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const localTime = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: showSeconds ? "2-digit" : undefined,
    hour12: true,
  });

  if (format === "stacked") {
    return (
      <div className={`flex flex-col ${className}`} title={d.toLocaleString()}>
        <span className="font-medium text-slate-700">{localDate}</span>
        <span className="text-[11px] text-slate-400">{localTime}</span>
      </div>
    );
  }

  if (format === "date-only") {
    return <span className={className} title={d.toLocaleString()}>{localDate}</span>;
  }

  if (format === "time-only") {
    return <span className={className} title={d.toLocaleString()}>{localTime}</span>;
  }

  if (format === "full") {
    return (
      <span className={className} title={d.toLocaleString()}>
        {d.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: showSeconds ? "2-digit" : undefined,
          hour12: true,
        })}
      </span>
    );
  }

  // compact default: "Oct 16, 2026, 2:28 AM"
  return (
    <span className={className} title={d.toLocaleString()}>
      {localDate}, {localTime}
    </span>
  );
}

"use client"

import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/** Theme-matched toasts: neutral surface, colour only on the icon. Mounted once in app/layout.tsx. */
const Toaster = (props: ToasterProps) => (
  <Sonner
    theme="dark"
    position="top-center"
    duration={4000}
    gap={8}
    className="toaster group"
    icons={{
      success: <CircleCheckIcon className="size-4 text-emerald-400" />,
      info: <InfoIcon className="size-4 text-muted-foreground" />,
      warning: <TriangleAlertIcon className="size-4 text-highlight" />,
      error: <OctagonXIcon className="size-4 text-red-400" />,
      loading: <Loader2Icon className="size-4 animate-spin text-muted-foreground" />,
    }}
    style={
      {
        "--normal-bg": "var(--elevated)",
        "--normal-text": "var(--foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius-lg)",
        "--width": "380px",
      } as React.CSSProperties
    }
    toastOptions={{
      classNames: {
        toast: "font-sans text-sm shadow-lg shadow-black/40",
        title: "font-medium",
        description: "text-muted-foreground",
        actionButton: "bg-highlight! text-highlight-foreground! font-medium!",
        cancelButton: "bg-muted! text-foreground!",
      },
    }}
    {...props}
  />
)

export { Toaster }

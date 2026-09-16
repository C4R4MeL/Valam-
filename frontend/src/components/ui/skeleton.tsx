import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("valam-skeleton rounded-md", className)}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }

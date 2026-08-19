import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors sm:h-9 sm:text-sm",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Somente leitura: mantém contraste total (legível e copiável), sinaliza pelo fundo.
          "read-only:bg-muted/50 read-only:text-foreground read-only:cursor-default",
          "aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:focus-visible:ring-destructive/30",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };

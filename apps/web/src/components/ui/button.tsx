import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-95 touch-manipulation",
          {
            'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80': variant === 'default',
            'hover:bg-accent hover:text-accent-foreground active:bg-accent/80': variant === 'ghost',
            'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80': variant === 'outline',
          },
          {
            'h-11 px-4 py-2 text-sm sm:h-10': size === 'default',
            'h-10 px-3 text-sm sm:h-9': size === 'sm',
            'h-12 px-8 text-base sm:h-11': size === 'lg',
            'h-11 w-11 sm:h-10 sm:w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }

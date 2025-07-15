import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="text-sm font-semibold text-foreground">{label}</label>
        )}
        <input
          type={type}
          className={cn(
            'flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm text-foreground',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:border-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive focus-visible:ring-destructive focus-visible:border-destructive',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm text-destructive font-medium">{error}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
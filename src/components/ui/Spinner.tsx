import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'white' | 'purple' | 'green' | 'gray'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8', 
  lg: 'h-12 w-12',
  xl: 'h-32 w-32'
}

const colorClasses = {
  blue: 'border-blue-600',
  white: 'border-white',
  purple: 'border-purple-600',
  green: 'border-green-600',
  gray: 'border-gray-600'
}

export default function Spinner({ 
  size = 'md', 
  color = 'blue', 
  className 
}: SpinnerProps) {
  return (
    <div 
      className={cn(
        'animate-spin rounded-full border-b-2',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  )
}
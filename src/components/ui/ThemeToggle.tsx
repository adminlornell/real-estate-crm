'use client'

import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/Button'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
      default:
        return <Sun className="h-4 w-4" />
    }
  }

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode'
      case 'dark':
        return 'Dark mode'
      case 'system':
        return 'System theme'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      title={getLabel()}
      className="h-9 w-9 p-0"
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </Button>
  )
}
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Home, Building, Users, CheckSquare, TrendingUp, FileText, LogOut } from 'lucide-react'

interface MainNavigationProps {
  title?: string
}

export default function MainNavigation({ title = 'Real Estate CRM' }: MainNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Home
    },
    {
      label: 'Properties', 
      path: '/properties',
      icon: Building
    },
    {
      label: 'Clients',
      path: '/clients', 
      icon: Users
    },
    {
      label: 'Tasks',
      path: '/tasks',
      icon: CheckSquare
    },
    {
      label: 'Documents',
      path: '/documents',
      icon: FileText
    },
    {
      label: 'Reports',
      path: '/reports',
      icon: TrendingUp
    }
  ]

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Still redirect to login even if sign out fails
      router.push('/login')
    }
  }

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path
    }
    return pathname.startsWith(path)
  }

  return (
    <header className="bg-background shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Left side - Logo/Title and Navigation */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            </div>
            
            <nav className="hidden sm:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)
                
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`group flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out ${
                      active
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 transform scale-105'
                        : 'text-foreground hover:text-primary hover:bg-accent hover:shadow-md hover:scale-105 border border-transparent hover:border-primary/20'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mr-2 transition-transform duration-200 ${
                      active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                    }`} />
                    {item.label}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right side - Theme toggle, User info and Sign Out */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-foreground font-medium hidden sm:block">
              Welcome back, {user?.email}
            </span>
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center text-foreground border-border hover:text-destructive hover:border-destructive/50 hover:bg-destructive/10 transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="w-4 h-4 mr-2 transition-transform duration-200 hover:scale-110" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="sm:hidden border-t border-border pt-4 pb-4">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`group flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ease-in-out whitespace-nowrap ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                      : 'text-foreground hover:text-primary hover:bg-accent hover:shadow-md border border-transparent hover:border-primary/20'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-1 transition-transform duration-200 ${
                    active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary group-hover:scale-110'
                  }`} />
                  {item.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
} 
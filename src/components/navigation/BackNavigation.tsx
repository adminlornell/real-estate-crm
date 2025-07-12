'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ArrowLeft } from 'lucide-react'

interface BackNavigationProps {
  backPath: string
  backLabel: string
  children?: React.ReactNode
}

export default function BackNavigation({ backPath, backLabel, children }: BackNavigationProps) {
  const router = useRouter()

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between w-full">
          <Button
            variant="ghost"
            onClick={() => router.push(backPath)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {backLabel}
          </Button>
          {children}
        </div>
      </div>
    </div>
  )
} 
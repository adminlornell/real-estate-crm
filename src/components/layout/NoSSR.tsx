'use client'

import dynamic from 'next/dynamic'
import { ReactNode } from 'react'

interface NoSSRProps {
  children: ReactNode
  fallback?: ReactNode
}

const NoSSR = ({ children, fallback }: NoSSRProps) => {
  return (
    <>
      {children}
    </>
  )
}

export default dynamic(() => Promise.resolve(NoSSR), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  )
}) 
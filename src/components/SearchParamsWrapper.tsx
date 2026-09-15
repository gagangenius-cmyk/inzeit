'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface SearchParamsWrapperProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SearchParamsWrapper({ 
  children, 
  fallback = (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}: SearchParamsWrapperProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  )
}

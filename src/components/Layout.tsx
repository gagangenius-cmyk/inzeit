'use client'

import { ReactNode } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
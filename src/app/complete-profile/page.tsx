import React, { Suspense } from 'react'
import CompleteProfileClient from '@/components/CompleteProfileClient'

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div>Loading profile form…</div>}>
      <CompleteProfileClient />
    </Suspense>
  )
}

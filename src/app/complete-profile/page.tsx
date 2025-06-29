import React, { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the client component with SSR disabled
const CompleteProfileClient = dynamic(() => import('./CompleteProfileClient'), {
  loading: () => <div />,
})

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={<div />}>
      <CompleteProfileClient />
    </Suspense>
  )
}

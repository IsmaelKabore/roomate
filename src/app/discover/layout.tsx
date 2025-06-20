import type { ReactNode } from 'react'
import DiscoverSelector from '@/components/DiscoverSelector'

export default function DiscoverLayout({ children }: { children: ReactNode }) {
  return <DiscoverSelector>{children}</DiscoverSelector>
}

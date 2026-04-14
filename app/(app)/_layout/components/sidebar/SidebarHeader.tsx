'use client'

/**
 * SidebarHeader.tsx
 *
 * Logo z animacją scrolla (tekst znika przy scrollowaniu) + SidebarTrigger.
 * Kliknięcie ikony logo = toggle sidebar (zgodnie z wymaganiem).
 */

import Image  from 'next/image'
import { motion } from 'framer-motion'
import { SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { useLogoScroll } from '../../hooks'

export function AppSidebarHeader() {
  const { toggleSidebar, open } = useSidebar()
  const { opacity, scale, maxWidth, gapOpacity } = useLogoScroll({
    scrollStart: 0,
    scrollEnd:   100,
  })

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          {/*
           * SidebarMenuButton jako trigger — pasuje semantycznie,
           * bo shadcn traktuje header jako pierwszą pozycję menu.
           */}
          <SidebarMenuButton
            size="lg"
            onClick={toggleSidebar}
            tooltip="Otwórz / zamknij menu"
            className="gap-3"
          >
            {/* Ikona logo — zawsze widoczna */}
            <Image
              src="/logo.png"
              alt="TimeTracker"
              width={28}
              height={28}
              priority
              className="shrink-0 object-contain"
            />

            {/*
             * Tekst — pojawia się tylko gdy sidebar jest otwarty.
             * group-data-[state=expanded] to klasa Tailwind z shadcn sidebar.
             * Dodatkowo animacja scrolla na tekście.
             */}
            <motion.div
              style={{ maxWidth, overflow: 'hidden' }}
              className="group-data-[collapsible=icon]:hidden"
            >
              <motion.span
                style={{ opacity, scale, transformOrigin: 'left center', display: 'block', whiteSpace: 'nowrap' }}
                className="text-base font-semibold tracking-tight"
                aria-hidden="true"
              >
                TimeTracker
              </motion.span>
            </motion.div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  )
}
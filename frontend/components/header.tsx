import * as React from 'react'
import Link from 'next/link'

import { auth } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  IconOpenAI1,
  IconOpenAI2,
  IconSeparator,
} from '@/components/ui/icons'
import { UserMenu } from '@/components/user-menu'
import { SidebarMobile } from './sidebar-mobile'
import { SidebarToggle } from './sidebar-toggle'
import { ChatHistory } from './chat-history'
import { Session } from '@/lib/types'
import { useTheme } from 'next-themes'
import { ThemeSelect } from './theme-select'


async function UserOrLogin() {
  const session = (await auth()) as Session
  const orgName: any = process.env.NEXT_PUBLIC_ORGNAME
  return (
    <>
      {session?.user ? (
        <>
          <SidebarMobile>
            <ChatHistory userId={session.user.id} />
          </SidebarMobile>
          <SidebarToggle />
        </>
      ) : (
        <div className="flex size-[24px] shrink-0 select-none items-center justify-center rounded-md border bg-aiicon text-primary-foreground shadow-sm">
          {!orgName ? (
            null
          ) : orgName === 'nainovate' ? (
            <IconOpenAI2 className="transition-all" />
          ) : orgName === 'brillius' ? (
            <IconOpenAI1 className="transition-all" />
          ) : (
            null
          )}
        </div>
      )}
      <div className="flex items-center">
        <IconSeparator className="size-6 text-muted-foreground/50" />
        {session?.user ? (
          <UserMenu user={session.user} />
        ) : (
          <Button variant="link" asChild className="-ml-2">
            <Link href="/login">Login</Link>
          </Button>
        )}
      </div>
    </>
  )
}

export async function Header() {
  const session = (await auth()) as Session

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 border-b shrink-0 bg-gradient-to-b from-background/10 via-background/50 to-background/80 backdrop-blur-xl">
      <div className="flex items-center">
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      {session?.user ? (
        null
      ) : 
      <ThemeSelect/>
      }
    </header>
  )
}

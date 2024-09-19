'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { IconMoon, IconSun, IconOpenAI, IconOpenAI1, IconOpenAI2 } from '@/components/ui/icons'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = React.useTransition()
  
  const orgName: any = process.env.NEXT_PUBLIC_ORGNAME

  React.useEffect(() => {     
    if (theme) {
      document.documentElement.className = theme
      }
  }, [theme])

  return (
    <Button
    variant="ghost"
    size="icon"
    onClick={() => {
      startTransition(() => {
        if (theme?.includes('light')) {
          setTheme(orgName + '-dark')
        } else {
          setTheme(orgName + '-light')
        }
      })
    }}
  >
    {!theme ? (
      null
    ) : theme?.includes('dark') ? (
      <IconMoon className="transition-all" />
    ) : theme?.includes('light') ? (
      <IconSun className="transition-all" />
    ) : (
      null
    )}
    <span className="sr-only">Toggle theme</span>

  </Button>
  )
}
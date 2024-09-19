'use client'
import * as React from 'react'
import { useTheme } from 'next-themes'

export function ThemeSelect() {
    const { setTheme } = useTheme()
    const [_, startTransition] = React.useTransition()
    const Themes: any = ['light','dark']

    return (
        <div className="flex flex-wrap md:flex-nowrap gap-1 ">
            <select className='p-1.5 border rounded-md bg-background text-sm' onChange={(e) => {
                startTransition(() => {
                    if (e.target.value === ''){
                        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                        if(isDarkMode){
                            setTheme('dark')
                        }else{
                            setTheme('light')
                        }
                    }
                    else{
                       setTheme(e.target.value) 
                    }
                   
                })
            }}>
                <option value="">Default</option>
                {Themes.map((theme: any) => {
                    return <option key={theme} value={theme}>{theme}</option>
                })}
            </select>
        </div>
    )
}
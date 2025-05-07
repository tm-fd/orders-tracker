'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from "@heroui/button"
import { Sun, Moon } from 'lucide-react'

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Button
      size="sm"
      variant="ghost"
      className="w-9 h-9 rounded-full"
      onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const { theme, setTheme, themes } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted before accessing theme
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const availableThemes = [
    { name: "Light", value: "light", description: "Light theme with white background and dark text" },
    { name: "Dark", value: "dark", description: "Dark theme with black background and light text" },
    { name: "Blue", value: "blue", description: "Blue-accented light theme" },
    { name: "Green", value: "green", description: "Green-accented light theme" },
    { name: "Purple", value: "purple", description: "Purple-accented light theme" },
    { name: "Orange", value: "orange", description: "Orange-accented light theme" },
    { name: "System", value: "system", description: "Follow your system's theme preference" },
  ]

  return (
    <div className="container mx-auto py-10">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Customize your experience with the Student-Job Matching System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Theme Preferences</h3>
            <RadioGroup value={theme} onValueChange={setTheme} className="space-y-4">
              {availableThemes.map((t) => (
                <div key={t.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={t.value} id={`theme-${t.value}`} />
                  <div className="grid gap-1.5">
                    <Label htmlFor={`theme-${t.value}`} className="font-medium">
                      {t.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setTheme("system")}>
              Reset to System Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

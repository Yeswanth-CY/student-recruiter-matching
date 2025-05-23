"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import { jobCategories as defaultJobCategories } from "@/lib/matching-config"
import { ArrowLeft, Save, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function ConfigPage() {
  const { toast } = useToast()
  const [jobCategories, setJobCategories] = useState(defaultJobCategories)
  const [activeTab, setActiveTab] = useState(jobCategories[0].id)
  const [isSaving, setIsSaving] = useState(false)

  // Function to update weights for a specific category
  const updateCategoryWeights = (categoryId: string, field: string, value: number) => {
    setJobCategories((prev) =>
      prev.map((category) => {
        if (category.id === categoryId) {
          // Create a copy of the weights object with the updated field
          const updatedWeights = { ...category.weights, [field]: value }

          // Normalize weights to ensure they sum to 1
          const sum = updatedWeights.skillMatch + updatedWeights.academicPerformance + updatedWeights.experience

          return {
            ...category,
            weights: {
              skillMatch: Number((updatedWeights.skillMatch / sum).toFixed(2)),
              academicPerformance: Number((updatedWeights.academicPerformance / sum).toFixed(2)),
              experience: Number((updatedWeights.experience / sum).toFixed(2)),
            },
          }
        }
        return category
      }),
    )
  }

  // Function to save configuration
  const saveConfiguration = async () => {
    setIsSaving(true)
    try {
      // In a real application, you would save this to a database or configuration file
      // For this demo, we'll just simulate a save operation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Update the localStorage with the new configuration
      localStorage.setItem("jobCategoriesConfig", JSON.stringify(jobCategories))

      toast({
        title: "Success",
        description: "Configuration saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to reset to defaults
  const resetToDefaults = () => {
    setJobCategories(defaultJobCategories)
    toast({
      title: "Reset Complete",
      description: "Configuration has been reset to defaults",
    })
  }

  return (
    <div className="container mx-auto py-10">
      <Link href="/" className="flex items-center text-sm mb-6 hover:underline">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Matching Algorithm Configuration</CardTitle>
          <CardDescription>
            Adjust weighting factors for different job categories to customize how matches are calculated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-4">
              {jobCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {jobCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Skill Match Weight: {(category.weights.skillMatch * 100).toFixed(0)}%</Label>
                      <span className="text-sm text-muted-foreground">
                        How much importance to give to matching skills
                      </span>
                    </div>
                    <Slider
                      value={[category.weights.skillMatch * 100]}
                      min={10}
                      max={90}
                      step={5}
                      onValueChange={(value) => updateCategoryWeights(category.id, "skillMatch", value[0] / 100)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>
                        Academic Performance Weight: {(category.weights.academicPerformance * 100).toFixed(0)}%
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        How much importance to give to academic scores
                      </span>
                    </div>
                    <Slider
                      value={[category.weights.academicPerformance * 100]}
                      min={5}
                      max={50}
                      step={5}
                      onValueChange={(value) =>
                        updateCategoryWeights(category.id, "academicPerformance", value[0] / 100)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Experience Weight: {(category.weights.experience * 100).toFixed(0)}%</Label>
                      <span className="text-sm text-muted-foreground">
                        How much importance to give to experience points
                      </span>
                    </div>
                    <Slider
                      value={[category.weights.experience * 100]}
                      min={5}
                      max={50}
                      step={5}
                      onValueChange={(value) => updateCategoryWeights(category.id, "experience", value[0] / 100)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Critical Skills (comma-separated)</Label>
                    <Input
                      value={category.weights.criticalSkills.join(", ")}
                      onChange={(e) =>
                        setJobCategories((prev) =>
                          prev.map((cat) =>
                            cat.id === category.id
                              ? {
                                  ...cat,
                                  weights: {
                                    ...cat.weights,
                                    criticalSkills: e.target.value.split(",").map((s) => s.trim()),
                                  },
                                }
                              : cat,
                          ),
                        )
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      These skills will receive extra weight in the matching algorithm
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
          <Button onClick={saveConfiguration} disabled={isSaving}>
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Configuration
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

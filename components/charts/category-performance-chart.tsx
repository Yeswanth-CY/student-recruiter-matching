"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface CategoryPerformanceChartProps {
  data: { id: string; name: string; count: number; percentage: number; avgScore: number }[]
}

export function CategoryPerformanceChart({ data }: CategoryPerformanceChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext("2d")
    if (!ctx) return

    // Sort data by average score
    const sortedData = [...data].sort((a, b) => b.avgScore - a.avgScore)

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedData.map((d) => d.name),
        datasets: [
          {
            label: "Average Match Score",
            data: sortedData.map((d) => d.avgScore),
            backgroundColor: "rgba(75, 192, 192, 0.5)",
            borderColor: "rgb(75, 192, 192)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Avg. Score: ${context.raw.toFixed(1)}%`,
              afterLabel: (context) => {
                const index = context.dataIndex
                return `Matches: ${sortedData[index].count}`
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Average Match Score (%)",
            },
          },
          y: {
            title: {
              display: true,
              text: "Job Category",
            },
          },
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [data])

  return <canvas ref={chartRef} />
}

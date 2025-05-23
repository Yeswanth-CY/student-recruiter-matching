"use client"

import { useEffect, useRef } from "react"
import { Chart, registerables } from "chart.js"

Chart.register(...registerables)

interface MatchScoreDistributionChartProps {
  data: { range: string; count: number }[]
}

export function MatchScoreDistributionChart({ data }: MatchScoreDistributionChartProps) {
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

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.range),
        datasets: [
          {
            label: "Number of Matches",
            data: data.map((d) => d.count),
            backgroundColor: [
              "rgba(255, 99, 132, 0.5)",
              "rgba(255, 159, 64, 0.5)",
              "rgba(255, 205, 86, 0.5)",
              "rgba(75, 192, 192, 0.5)",
              "rgba(54, 162, 235, 0.5)",
            ],
            borderColor: [
              "rgb(255, 99, 132)",
              "rgb(255, 159, 64)",
              "rgb(255, 205, 86)",
              "rgb(75, 192, 192)",
              "rgb(54, 162, 235)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => `Matches: ${context.raw}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Number of Matches",
            },
            ticks: {
              precision: 0,
            },
          },
          x: {
            title: {
              display: true,
              text: "Match Score Range",
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

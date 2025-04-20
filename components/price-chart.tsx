"use client"

import { useRef } from "react"
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend } from "chart.js"
import { Line } from "react-chartjs-2"

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend)

interface PriceChartProps {
  data: { time: number; price: number }[]
  timeRange: "24h" | "7d" | "30d" | "90d" | "1y"
  color: string
}

export default function PriceChart({ data, timeRange, color }: PriceChartProps) {
  const chartRef = useRef<Chart | null>(null)

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)

    if (timeRange === "24h") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (timeRange === "7d") {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  // Take fewer data points for better visualization
  const getReducedData = () => {
    if (data.length === 0) return { labels: [], prices: [] }

    let step = 1
    if (timeRange === "24h") step = Math.max(1, Math.floor(data.length / 24))
    else if (timeRange === "7d") step = Math.max(1, Math.floor(data.length / 7))
    else if (timeRange === "30d") step = Math.max(1, Math.floor(data.length / 30))
    else if (timeRange === "90d") step = Math.max(1, Math.floor(data.length / 45))
    else step = Math.max(1, Math.floor(data.length / 52)) // 1y

    const reducedData = data.filter((_, index) => index % step === 0)

    return {
      labels: reducedData.map((d) => formatTime(d.time)),
      prices: reducedData.map((d) => d.price),
    }
  }

  const { labels, prices } = getReducedData()

  const chartData = {
    labels,
    datasets: [
      {
        label: "Price",
        data: prices,
        borderColor: color,
        backgroundColor: `${color}33`, // Add transparency
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: prices[0] < 1 ? 6 : 2,
                maximumFractionDigits: prices[0] < 1 ? 6 : 2,
              }).format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          color: "rgba(107, 114, 128, 0.7)",
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        position: "right" as const,
        grid: {
          color: "rgba(229, 231, 235, 0.5)",
          drawBorder: false,
        },
        ticks: {
          color: "rgba(107, 114, 128, 0.7)",
          font: {
            size: 11,
          },
          padding: 8,
          callback: (value: any) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: prices[0] < 1 ? 2 : 0,
              maximumFractionDigits: prices[0] < 1 ? 2 : 0,
            }).format(value),
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 0,
      },
      line: {
        borderJoinStyle: "round" as const,
      },
    },
    animation: {
      duration: 750,
      easing: "easeOutQuart",
    },
  }

  return <Line data={chartData} options={options} className="w-full h-full" />
}

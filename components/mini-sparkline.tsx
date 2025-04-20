"use client"

import { useRef, useEffect } from "react"

interface MiniSparklineProps {
  data: number[]
  color: string
  width?: number
  height?: number
}

export default function MiniSparkline({ data, color, width = 100, height = 30 }: MiniSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Set canvas dimensions
    canvas.width = width
    canvas.height = height

    // Find min and max values for scaling
    const minValue = Math.min(...data)
    const maxValue = Math.max(...data)
    const range = maxValue - minValue

    // Draw the sparkline
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5

    // Move to the first point
    const xStep = width / (data.length - 1)
    const firstY = height - ((data[0] - minValue) / range) * height
    ctx.moveTo(0, firstY)

    // Draw lines to each point
    for (let i = 1; i < data.length; i++) {
      const x = i * xStep
      const y = height - ((data[i] - minValue) / range) * height
      ctx.lineTo(x, y)
    }

    ctx.stroke()

    // Add a subtle gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, `${color}20`) // 20% opacity
    gradient.addColorStop(1, `${color}05`) // 5% opacity

    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [data, color, width, height])

  return <canvas ref={canvasRef} width={width} height={height} className="inline-block" />
}

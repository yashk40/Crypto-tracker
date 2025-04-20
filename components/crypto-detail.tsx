"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, StarOff, ArrowUp, ArrowDown, ExternalLink, Info } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import PriceChart from "./price-chart"
import type { Crypto } from "./crypto-tracker"

interface CryptoDetailProps {
  crypto: Crypto
  isFavorite: boolean
  onToggleFavorite: () => void
}

type TimeRange = "24h" | "7d" | "30d" | "90d" | "1y"

interface CryptoDetailData {
  description: { en: string }
  links: { homepage: string[]; blockchain_site: string[] }
  market_data: {
    current_price: { usd: number }
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_30d: number
    price_change_percentage_60d: number
    price_change_percentage_1y: number
    market_cap: { usd: number }
    total_volume: { usd: number }
    circulating_supply: number
    total_supply: number
    max_supply: number
    ath: { usd: number }
    ath_date: { usd: string }
    atl: { usd: number }
    atl_date: { usd: string }
  }
}

export default function CryptoDetail({ crypto, isFavorite, onToggleFavorite }: CryptoDetailProps) {
  const [detailData, setDetailData] = useState<CryptoDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("7d")
  const [chartData, setChartData] = useState<{ time: number; price: number }[]>([])

  // Using environment variable for API key
  const API_KEY = process.env.NEXT_PUBLIC_COINGECKO_API_KEY || "CG-h41xQSBnxpeyycKsrQVkAh6i"

  useEffect(() => {
    const fetchCryptoDetail = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${crypto.id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&x_cg_demo_api_key=${API_KEY}`
        )

        if (!response.ok) {
          throw new Error("Failed to fetch detailed data. API rate limit may have been reached.")
        }

        const data = await response.json()
        setDetailData(data)
        await fetchHistoricalData(timeRange)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchCryptoDetail()
  }, [crypto.id, API_KEY, timeRange])

  const fetchHistoricalData = async (range: TimeRange) => {
    try {
      let days: number
      switch (range) {
        case "24h":
          days = 1
          break
        case "7d":
          days = 7
          break
        case "30d":
          days = 30
          break
        case "90d":
          days = 90
          break
        case "1y":
          days = 365
          break
        default:
          days = 7
      }

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${crypto.id}/market_chart?vs_currency=usd&days=${days}&x_cg_demo_api_key=${API_KEY}`
      )

      if (!response.ok) {
        throw new Error("Failed to fetch chart data")
      }

      const data = await response.json()
      const formattedData = data.prices.map((item: [number, number]) => ({
        time: item[0],
        price: item[1],
      }))

      setChartData(formattedData)
      setTimeRange(range)
    } catch (err) {
      console.error("Error fetching historical data:", err)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: price < 1 ? 6 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)
  }

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) {
      return `${(num / 1e12).toFixed(2)}T`
    } else if (num >= 1e9) {
      return `${(num / 1e9).toFixed(2)}B`
    } else if (num >= 1e6) {
      return `${(num / 1e6).toFixed(2)}M`
    } else {
      return num.toLocaleString()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-[300px]" />
            <Skeleton className="h-4 w-[250px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
        <p>{error}</p>
        <p className="text-sm mt-1">Note: CoinGecko API has rate limits for free usage.</p>
      </div>
    )
  }

  if (!detailData) {
    return null
  }

  const priceChangePercent =
    detailData.market_data[
      `price_change_percentage_${timeRange === "24h" ? "24h" : timeRange === "7d" ? "7d" : timeRange === "30d" ? "30d" : timeRange === "90d" ? "60d" : "1y"}`
    ]
  const isPriceUp = priceChangePercent > 0

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-xl">
                <img src={crypto.image || "/placeholder.svg"} alt={crypto.name} className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  {crypto.name}
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-normal uppercase">
                    {crypto.symbol}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleFavorite}
                    className="ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {isFavorite ? (
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-5 w-5 text-gray-400" />
                    )}
                  </Button>
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(detailData.market_data.current_price.usd)}
                  </span>
                  <span
                    className={`flex items-center text-sm font-medium px-2 py-0.5 rounded-full ${
                      isPriceUp
                        ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                        : "text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
                    }`}
                  >
                    {isPriceUp ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
                    {isPriceUp ? "+" : ""}
                    {priceChangePercent?.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {detailData.links.homepage[0] && (
              <a
                href={detailData.links.homepage[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                Official Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Price Chart</CardTitle>
          <div className="flex justify-between items-center">
            <CardDescription>
              {timeRange === "24h"
                ? "Last 24 hours"
                : timeRange === "7d"
                  ? "Last 7 days"
                  : timeRange === "30d"
                    ? "Last 30 days"
                    : timeRange === "90d"
                      ? "Last 90 days"
                      : "Last year"}
            </CardDescription>
            <div className="flex gap-1">
              <Button
                variant={timeRange === "24h" ? "default" : "outline"}
                size="sm"
                onClick={() => fetchHistoricalData("24h")}
                className="h-7 text-xs rounded-full"
              >
                24h
              </Button>
              <Button
                variant={timeRange === "7d" ? "default" : "outline"}
                size="sm"
                onClick={() => fetchHistoricalData("7d")}
                className="h-7 text-xs rounded-full"
              >
                7d
              </Button>
              <Button
                variant={timeRange === "30d" ? "default" : "outline"}
                size="sm"
                onClick={() => fetchHistoricalData("30d")}
                className="h-7 text-xs rounded-full"
              >
                30d
              </Button>
              <Button
                variant={timeRange === "90d" ? "default" : "outline"}
                size="sm"
                onClick={() => fetchHistoricalData("90d")}
                className="h-7 text-xs rounded-full"
              >
                90d
              </Button>
              <Button
                variant={timeRange === "1y" ? "default" : "outline"}
                size="sm"
                onClick={() => fetchHistoricalData("1y")}
                className="h-7 text-xs rounded-full"
              >
                1y
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <PriceChart data={chartData} timeRange={timeRange} color={isPriceUp ? "#10b981" : "#ef4444"} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Market Stats
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Key market statistics for {crypto.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Market Cap</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatPrice(detailData.market_data.market_cap.usd)}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">24h Trading Volume</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatPrice(detailData.market_data.total_volume.usd)}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Circulating Supply</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatLargeNumber(detailData.market_data.circulating_supply)} {crypto.symbol.toUpperCase()}
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">Total Supply</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {detailData.market_data.total_supply
                    ? `${formatLargeNumber(detailData.market_data.total_supply)} ${crypto.symbol.toUpperCase()}`
                    : "N/A"}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500 dark:text-gray-400">Max Supply</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {detailData.market_data.max_supply
                    ? `${formatLargeNumber(detailData.market_data.max_supply)} ${crypto.symbol.toUpperCase()}`
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Price History
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">Historical price data and changes for {crypto.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">All Time High</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  <div>{formatPrice(detailData.market_data.ath.usd)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(detailData.market_data.ath_date.usd).toLocaleDateString()}
                  </div>
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">All Time Low</dt>
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  <div>{formatPrice(detailData.market_data.atl.usd)}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(detailData.market_data.atl_date.usd).toLocaleDateString()}
                  </div>
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">24h Change</dt>
                <dd
                  className={`font-medium ${detailData.market_data.price_change_percentage_24h > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                >
                  {detailData.market_data.price_change_percentage_24h > 0 ? "+" : ""}
                  {detailData.market_data.price_change_percentage_24h.toFixed(2)}%
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <dt className="text-gray-500 dark:text-gray-400">7d Change</dt>
                <dd
                  className={`font-medium ${detailData.market_data.price_change_percentage_7d > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                >
                  {detailData.market_data.price_change_percentage_7d > 0 ? "+" : ""}
                  {detailData.market_data.price_change_percentage_7d.toFixed(2)}%
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-gray-500 dark:text-gray-400">30d Change</dt>
                <dd
                  className={`font-medium ${detailData.market_data.price_change_percentage_30d > 0 ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                >
                  {detailData.market_data.price_change_percentage_30d > 0 ? "+" : ""}
                  {detailData.market_data.price_change_percentage_30d.toFixed(2)}%
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      {detailData.description.en && (
        <Card className="border-0 shadow-md bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <CardHeader>
            <CardTitle>About {crypto.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-600 dark:prose-p:text-gray-300"
              dangerouslySetInnerHTML={{
                __html: detailData.description.en.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" '),
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
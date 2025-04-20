"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Star, StarOff, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import MiniSparkline from "./mini-sparkline"
import type { Crypto } from "./crypto-tracker"

interface CryptoTableProps {
  cryptos: Crypto[]
  loading: boolean
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onSelectCrypto: (crypto: Crypto) => void
  emptyMessage?: string
}

export default function CryptoTable({
  cryptos,
  loading,
  favorites,
  onToggleFavorite,
  onSelectCrypto,
  emptyMessage = "No cryptocurrencies found.",
}: CryptoTableProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: price < 1 ? 6 : 2,
      maximumFractionDigits: price < 1 ? 6 : 2,
    }).format(price)
  }

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `${(marketCap / 1e12).toFixed(2)}T`
    } else if (marketCap >= 1e9) {
      return `${(marketCap / 1e9).toFixed(2)}B`
    } else if (marketCap >= 1e6) {
      return `${(marketCap / 1e6).toFixed(2)}M`
    } else {
      return `${marketCap.toLocaleString()}`
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-[180px]" />
                <Skeleton className="h-4 w-[120px]" />
              </div>
              <Skeleton className="h-10 w-[100px]" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (cryptos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/50">
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h %</TableHead>
              <TableHead className="text-right hidden md:table-cell">Market Cap</TableHead>
              <TableHead className="text-right hidden lg:table-cell">7d Chart</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cryptos.map((crypto) => (
              <TableRow
                key={crypto.id}
                className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                onClick={() => onSelectCrypto(crypto)}
              >
                <TableCell className="font-medium text-gray-500 dark:text-gray-400">{crypto.market_cap_rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={crypto.image || "/placeholder.svg"}
                      alt={crypto.name}
                      className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 p-0.5"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{crypto.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{crypto.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900 dark:text-gray-100">
                  {formatPrice(crypto.current_price)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium flex items-center justify-end gap-1 ${
                    crypto.price_change_percentage_24h > 0
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {crypto.price_change_percentage_24h > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : (
                    <ArrowDown className="w-3 h-3" />
                  )}
                  {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                </TableCell>
                <TableCell className="text-right hidden md:table-cell text-gray-900 dark:text-gray-100">
                  {formatMarketCap(crypto.market_cap)}
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell">
                  {crypto.sparkline_in_7d?.price && (
                    <MiniSparkline
                      data={crypto.sparkline_in_7d.price}
                      color={
                        crypto.price_change_percentage_7d_in_currency &&
                        crypto.price_change_percentage_7d_in_currency > 0
                          ? "#10b981"
                          : "#ef4444"
                      }
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      onToggleFavorite(crypto.id)
                    }}
                    className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {favorites.includes(crypto.id) ? (
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

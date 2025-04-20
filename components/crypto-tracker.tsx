"use client"

import { useState, useEffect } from "react"
import { Search, RefreshCw, Moon, Sun } from "lucide-react"
import CryptoTable from "./crypto-table"
import CryptoDetail from "./crypto-detail"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"

export type Crypto = {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  price_change_percentage_24h: number
  price_change_percentage_7d_in_currency?: number
  sparkline_in_7d?: { price: number[] }
  favorite?: boolean
}

export default function CryptoTracker() {
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [filteredCryptos, setFilteredCryptos] = useState<Crypto[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const { resolvedTheme, setTheme } = useTheme()

  const fetchCryptos = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h,7d",
      )

      if (!response.ok) {
        throw new Error("Failed to fetch data. API rate limit may have been reached.")
      }

      const data = await response.json()

      // Add favorite property to each crypto
      const cryptosWithFavorites = data.map((crypto: Crypto) => ({
        ...crypto,
        favorite: favorites.includes(crypto.id),
      }))

      setCryptos(cryptosWithFavorites)
      setFilteredCryptos(cryptosWithFavorites)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("cryptoFavorites")
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites))
    }

    fetchCryptos()

    // Set up refresh interval (every 2 minutes)
    const interval = setInterval(fetchCryptos, 120000)
    return () => clearInterval(interval)
  }, [])

  // Update filtered cryptos when search term or favorites change
  useEffect(() => {
    if (searchTerm) {
      const filtered = cryptos.filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredCryptos(filtered)
    } else {
      setFilteredCryptos(cryptos)
    }
  }, [searchTerm, cryptos])

  // Update cryptos with favorite status when favorites change
  useEffect(() => {
    // Save favorites to localStorage
    localStorage.setItem("cryptoFavorites", JSON.stringify(favorites))

    // Update the cryptos with the new favorite status
    setCryptos((prevCryptos) =>
      prevCryptos.map((crypto) => ({
        ...crypto,
        favorite: favorites.includes(crypto.id),
      })),
    )
  }, [favorites])

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleCryptoSelect = (crypto: Crypto) => {
    setSelectedCrypto(crypto)
  }

  const handleRefresh = () => {
    fetchCryptos()
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg w-8 h-8 flex items-center justify-center text-white font-bold">
              C
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">CryptoTracker</h1>
          </div>

          <div className="flex items-center gap-2" >
            <button   onClick={toggleTheme} className="rounded-full bg-transparent border-0 mx-8" >
              {resolvedTheme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4 " />}
            </button>
            <button onClick={handleRefresh}  className="rounded-full">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {!selectedCrypto && (
          <div className="max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">Cryptocurrency Market</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Track real-time prices and market data for the top cryptocurrencies
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search cryptocurrencies..."
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
            <p className="text-sm mt-1">Note: CoinGecko API has rate limits for free usage.</p>
          </div>
        )}

        {selectedCrypto ? (
          <div className="max-w-4xl mx-auto">
            <Button
              variant="ghost"
              className="mb-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setSelectedCrypto(null)}
            >
              ← Back to list
            </Button>
            <CryptoDetail
              crypto={selectedCrypto}
              isFavorite={favorites.includes(selectedCrypto.id)}
              onToggleFavorite={() => toggleFavorite(selectedCrypto.id)}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="mb-6 w-full sm:w-auto bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger
                  value="all"
                  className="flex-1 sm:flex-initial rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  All Cryptocurrencies
                </TabsTrigger>
                <TabsTrigger
                  value="favorites"
                  className="flex-1 sm:flex-initial rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700"
                >
                  Favorites
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <CryptoTable
                  cryptos={filteredCryptos}
                  loading={loading}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onSelectCrypto={handleCryptoSelect}
                />
              </TabsContent>

              <TabsContent value="favorites">
                <CryptoTable
                  cryptos={filteredCryptos.filter((crypto) => favorites.includes(crypto.id))}
                  loading={loading}
                  favorites={favorites}
                  onToggleFavorite={toggleFavorite}
                  onSelectCrypto={handleCryptoSelect}
                  emptyMessage="No favorite cryptocurrencies yet. Add some from the All Cryptocurrencies tab."
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}

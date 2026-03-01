import { useState } from "react"
import Header from "@/components/Header"
import Icon from "@/components/ui/icon"

const SEARCH_URL = "https://functions.poehali.dev/3e2e5f60-84e1-4640-bdd8-18704f100c98"

type SearchType = "web" | "images" | "videos" | "news"

interface Result {
  title: string
  url: string
  snippet?: string
  display_url?: string
  thumbnail?: string
  image?: string
  channel?: string
  duration?: string
  views?: string
  source?: string
  type: string
}

const TABS: { key: SearchType; label: string; icon: string }[] = [
  { key: "web", label: "Сайты", icon: "Globe" },
  { key: "images", label: "Картинки", icon: "Image" },
  { key: "videos", label: "Видео", icon: "Play" },
  { key: "news", label: "Новости", icon: "Newspaper" },
]

export default function Browser() {
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<SearchType>("web")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchedQuery, setSearchedQuery] = useState("")

  const doSearch = async (q: string, type: SearchType) => {
    if (!q.trim()) return
    setLoading(true)
    setSearched(false)
    setResults([])
    try {
      const res = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(q)}&type=${type}`)
      const data = await res.json()
      setResults(data.results || [])
      setSearchedQuery(q)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    doSearch(query, activeTab)
  }

  const handleTabChange = (tab: SearchType) => {
    setActiveTab(tab)
    if (searched) doSearch(searchedQuery, tab)
  }

  const quickLinks = ["ChatGPT", "Кибербезопасность", "Искусственный интеллект", "GitHub", "Habr", "Новости технологий"]

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative h-[600px]">
          <Header />
        </div>

        <div className="px-4 md:px-0 pb-20">
          {/* Search block */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-8 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-mono text-foreground mb-1">
              <span className="text-accent">_</span>поиск без рекламы
            </h1>
            <p className="text-muted-foreground font-mono text-xs mb-5">
              Сайты · Картинки · Видео · Новости — всё в одном месте
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введи любой запрос..."
                autoFocus
                className="flex-1 bg-input border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-accent text-accent-foreground px-6 py-3 rounded-xl font-mono text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Search" size={16} />}
                Найти
              </button>
            </form>

            {/* Quick searches */}
            <div className="flex gap-2 flex-wrap">
              {quickLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => { setQuery(link); doSearch(link, activeTab) }}
                  className="px-3 py-1 rounded-lg font-mono text-xs border border-border text-muted-foreground hover:text-accent hover:border-accent transition-all"
                >
                  {link}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          {(searched || loading) && (
            <div className="flex items-center gap-1 mb-4 border-b border-border pb-2 flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-t-lg font-mono text-xs transition-all ${
                    activeTab === tab.key
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon name={tab.icon} size={13} />
                  {tab.label}
                </button>
              ))}
              {searched && (
                <span className="ml-auto font-mono text-xs text-muted-foreground/50 self-center pr-1">
                  {results.length} результатов · «{searchedQuery}»
                </span>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Icon name="Loader2" size={32} className="text-accent animate-spin" />
              <p className="font-mono text-sm text-muted-foreground">Ищу результаты по «{query}»...</p>
            </div>
          )}

          {/* Results: WEB & NEWS */}
          {!loading && searched && (activeTab === "web" || activeTab === "news") && (
            <div className="flex flex-col gap-3">
              {results.length === 0 && (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  Ничего не найдено. Попробуй другой запрос.
                </div>
              )}
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl border border-border bg-card p-4 hover:border-accent transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs text-muted-foreground mb-1 truncate">{r.display_url || r.url}</div>
                      <div className="text-foreground font-semibold text-sm mb-1 group-hover:text-accent transition-colors leading-snug">
                        {r.title}
                      </div>
                      {r.snippet && (
                        <div className="text-muted-foreground font-mono text-xs leading-relaxed line-clamp-2">
                          {r.snippet}
                        </div>
                      )}
                    </div>
                    <Icon name="ArrowUpRight" size={16} className="text-muted-foreground group-hover:text-accent transition-colors flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Results: IMAGES */}
          {!loading && searched && activeTab === "images" && (
            <div>
              {results.length === 0 && (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  Картинки не найдены. Попробуй другой запрос.
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {results.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl overflow-hidden border border-border hover:border-accent transition-all"
                  >
                    <div className="relative bg-card aspect-square overflow-hidden">
                      <img
                        src={r.thumbnail || r.image}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                        <Icon name="ExternalLink" size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <div className="p-2 bg-card">
                      <div className="font-mono text-xs text-muted-foreground truncate">{r.title}</div>
                      {r.source && <div className="font-mono text-xs text-muted-foreground/50 truncate">{r.source}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Results: VIDEOS */}
          {!loading && searched && activeTab === "videos" && (
            <div>
              {results.length === 0 && (
                <div className="text-center py-16 text-muted-foreground font-mono text-sm">
                  Видео не найдено. Попробуй другой запрос.
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((r, i) => (
                  <a
                    key={i}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-xl overflow-hidden border border-border hover:border-accent transition-all bg-card"
                  >
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {r.thumbnail && (
                        <img
                          src={r.thumbnail}
                          alt={r.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-accent/80 transition-colors">
                          <Icon name="Play" size={20} className="text-white ml-1" />
                        </div>
                      </div>
                      {r.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-xs px-2 py-0.5 rounded">
                          {r.duration}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-foreground font-semibold text-sm leading-snug mb-1 group-hover:text-accent transition-colors line-clamp-2">
                        {r.title}
                      </div>
                      <div className="flex items-center justify-between">
                        {r.channel && <div className="font-mono text-xs text-muted-foreground truncate">{r.channel}</div>}
                        {r.views && <div className="font-mono text-xs text-muted-foreground/60 flex-shrink-0 ml-2">{r.views}</div>}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !searched && (
            <div className="rounded-2xl border border-border border-dashed bg-card/50 p-12 text-center">
              <Icon name="Search" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-sm text-muted-foreground">Введи запрос — покажу всё что найду</p>
              <p className="font-mono text-xs text-muted-foreground/50 mt-1">Сайты · Картинки · Видео · Новости</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
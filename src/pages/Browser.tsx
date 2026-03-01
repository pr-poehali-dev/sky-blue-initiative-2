import { useState, useRef } from "react"
import Header from "@/components/Header"
import Icon from "@/components/ui/icon"

const SEARCH_ENGINES = [
  { name: "DuckDuckGo", url: "https://duckduckgo.com/?q=", icon: "Search" },
  { name: "Google", url: "https://www.google.com/search?q=", icon: "Search" },
  { name: "Yandex", url: "https://yandex.ru/search/?text=", icon: "Search" },
]

const Browser = () => {
  const [query, setQuery] = useState("")
  const [frameUrl, setFrameUrl] = useState("")
  const [engine, setEngine] = useState(SEARCH_ENGINES[0])
  const [loading, setLoading] = useState(false)
  const [frameError, setFrameError] = useState(false)
  const [addressBar, setAddressBar] = useState("")
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const navigate = (url: string) => {
    setFrameError(false)
    setLoading(true)
    setFrameUrl(url)
    setAddressBar(url)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const url = query.trim()
    if (url.startsWith("http://") || url.startsWith("https://")) {
      navigate(url)
    } else if (url.includes(".") && !url.includes(" ")) {
      navigate("https://" + url)
    } else {
      navigate(engine.url + encodeURIComponent(url))
    }
  }

  const handleAddressBar = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(addressBar)
  }

  const quickLinks = [
    { label: "Wikipedia", url: "https://ru.wikipedia.org" },
    { label: "GitHub", url: "https://github.com" },
    { label: "Habr", url: "https://habr.com" },
    { label: "Stack Overflow", url: "https://stackoverflow.com" },
  ]

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <div className="max-w-[1200px] mx-auto">
        <div className="relative h-[600px]">
          <Header />
        </div>

        <div className="px-4 md:px-0 pb-20">
          {/* Search block */}
          <div className="rounded-2xl border border-border bg-card p-6 md:p-10 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold font-mono text-foreground mb-2">
              <span className="text-accent">_</span>браузер без рекламы
            </h1>
            <p className="text-muted-foreground font-mono text-sm mb-6">
              Введи запрос или адрес сайта — реклама заблокирована по умолчанию
            </p>

            {/* Engine select */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {SEARCH_ENGINES.map((e) => (
                <button
                  key={e.name}
                  onClick={() => setEngine(e)}
                  className={`px-3 py-1 rounded-full font-mono text-xs border transition-all ${
                    engine.name === e.name
                      ? "border-accent text-accent bg-accent/10"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {e.name}
                </button>
              ))}
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Введи запрос или адрес сайта..."
                className="flex-1 bg-input border border-border rounded-xl px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="bg-accent text-accent-foreground px-5 py-3 rounded-xl font-mono text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <Icon name="Search" size={16} />
                Найти
              </button>
            </form>

            {/* Quick links */}
            <div className="flex gap-2 flex-wrap">
              {quickLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => navigate(link.url)}
                  className="px-3 py-1 rounded-lg font-mono text-xs border border-border text-muted-foreground hover:text-foreground hover:border-accent transition-all"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Browser frame */}
          {frameUrl && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                </div>

                <form onSubmit={handleAddressBar} className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={addressBar}
                    onChange={(e) => setAddressBar(e.target.value)}
                    className="flex-1 bg-input border border-border rounded-lg px-3 py-1 font-mono text-xs text-foreground focus:outline-none focus:border-accent transition-colors"
                  />
                  <button type="submit" className="text-muted-foreground hover:text-accent transition-colors">
                    <Icon name="ArrowRight" size={14} />
                  </button>
                </form>

                <div className="flex gap-2 text-muted-foreground">
                  <button
                    onClick={() => navigate(frameUrl)}
                    className="hover:text-accent transition-colors"
                    title="Обновить"
                  >
                    <Icon name="RefreshCw" size={14} />
                  </button>
                  <a
                    href={frameUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-accent transition-colors"
                    title="Открыть в новой вкладке"
                  >
                    <Icon name="ExternalLink" size={14} />
                  </a>
                </div>
              </div>

              {/* Status bar */}
              {loading && !frameError && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 border-b border-border">
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="font-mono text-xs text-muted-foreground">Загрузка...</span>
                </div>
              )}

              {/* Frame or fallback */}
              {frameError ? (
                <div className="flex flex-col items-center justify-center h-[500px] gap-4 text-center px-8">
                  <Icon name="ShieldOff" size={48} className="text-muted-foreground" />
                  <div>
                    <p className="font-mono text-sm text-foreground mb-1">Сайт заблокировал встраивание</p>
                    <p className="font-mono text-xs text-muted-foreground mb-4">
                      Большинство крупных сайтов защищены от отображения во фреймах — это их решение
                    </p>
                    <a
                      href={frameUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-xl font-mono text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Icon name="ExternalLink" size={14} />
                      Открыть напрямую
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  ref={iframeRef}
                  src={frameUrl}
                  className="w-full h-[500px] border-0"
                  title="Browser"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false)
                    setFrameError(true)
                  }}
                />
              )}
            </div>
          )}

          {/* No frame yet — info */}
          {!frameUrl && (
            <div className="rounded-2xl border border-border border-dashed bg-card/50 p-10 text-center">
              <Icon name="Globe" size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="font-mono text-sm text-muted-foreground">
                Введи запрос выше — результаты откроются здесь
              </p>
              <p className="font-mono text-xs text-muted-foreground/60 mt-1">
                Реклама заблокирована · Поиск через {engine.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Browser

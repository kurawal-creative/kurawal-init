import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Brain, Heart, Loader2, Send } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/api-client'

function KimiPage() {
  const [query, setQuery] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const handleNonStreaming = async () => {
    if (!query.trim() || !apiKey.trim()) return

    setLoading(true)
    setError('')
    setResponse('')

    try {
      const result = await apiClient.queryKimi({ query }, apiKey)
      setResponse(result.html)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to query Kimi')
    } finally {
      setLoading(false)
    }
  }

  const handleStreaming = () => {
    if (!query.trim() || !apiKey.trim()) return

    setStreaming(true)
    setError('')
    setResponse('')
    setProgress(0)
    setLastHeartbeat(null)

    eventSourceRef.current = apiClient.kimiStream(query, apiKey, {
      onChunk: (data: { html: string; progress: number }) => {
        setResponse(data.html)
        setProgress(data.progress)
      },
      onError: (errorMsg: string) => {
        setError(errorMsg)
        setStreaming(false)
      },
      onDone: () => {
        setStreaming(false)
        setProgress(100)
      },
      onHeartbeat: () => {
        setLastHeartbeat(new Date())
      },
    })
  }

  const stopStreaming = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setStreaming(false)
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Brain className="h-6 w-6 text-white" />
          </div>
          Kimi AI Assistant
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Ask questions and get intelligent AI-powered responses
        </p>
      </div>

      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle>Ask Kimi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium mb-2">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading || streaming}
            />
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Ask anything... (e.g., What is React?)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleStreaming()
                }
              }}
              disabled={loading || streaming}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleStreaming}
              disabled={loading || streaming || !query.trim() || !apiKey.trim()}
              className="flex-1"
            >
              {streaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Streaming... {progress.toFixed(0)}%
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Stream Response (SSE)
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleNonStreaming}
              disabled={loading || streaming || !query.trim() || !apiKey.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-4 w-4" />
                  Get Full Response
                </>
              )}
            </Button>

            {streaming && (
              <Button variant="destructive" onClick={stopStreaming}>
                Stop
              </Button>
            )}
          </div>

          {/* Status indicators */}
          {streaming && (
            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Streaming active
              </div>
              {lastHeartbeat && (
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 text-red-500" />
                  Last heartbeat: {lastHeartbeat.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {progress > 0 && progress < 100 && (
            <div className="space-y-1">
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {progress.toFixed(1)}% complete
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mt-0.5" />
              <div>
                <p className="font-medium">Error occurred</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Response */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: response }}
            />
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
            💡 Tips
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
            <li>• Use "Stream Response" to see answers in real-time</li>
            <li>• Use "Get Full Response" to wait for complete answer</li>
            <li>• Heartbeat indicator shows connection is alive</li>
            <li>• Maximum stream duration is 5 minutes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default KimiPage

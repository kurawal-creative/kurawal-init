import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Key, Plus, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export const Route = createFileRoute('/admin/api-keys')({
  component: ApiKeysPage,
})

interface ApiKey {
  id: string
  name: string
  key: string
  createdAt: string
  updatedAt: string
}

function ApiKeysPage() {
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKeys, setApiKeys] = useState<Array<ApiKey>>([])

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch(`/api/api-keys?page=1&pageSize=100`)
      const result = await response.json()
      if (result.success && result.data) {
        setApiKeys(result.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !key) return

    setLoading(true)
    try {
      const response = await fetch(`/api/api-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, key }),
      })

      const result = await response.json()
      if (result.success) {
        alert('API Key berhasil ditambahkan!')
        setName('')
        setKey('')
        fetchApiKeys()
      } else {
        alert(`Gagal menambahkan API Key: ${result.message}`)
      }
    } catch (error) {
      console.error('Error adding API key:', error)
      alert('Gagal menambahkan API Key')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (apiKeyId: string, apiKeyName: string) => {
    if (
      !confirm(
        `Hapus API Key "${apiKeyName}"? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return

    try {
      const response = await fetch(`/api/api-keys/${apiKeyId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        alert('API Key berhasil dihapus!')
        fetchApiKeys()
      } else {
        alert(`Gagal menghapus API Key: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      alert('Gagal menghapus API Key')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
            <Key className="h-6 w-6 text-white" />
          </div>
          API Keys Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Kelola API keys untuk integrasi AI
        </p>
      </div>

      {/* Form Tambah API Key */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah API Key</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Gemini API Key"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="key" className="block text-sm font-medium mb-2">
                API Key
              </label>
              <Input
                id="key"
                type="text"
                placeholder="AIzaSy..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? 'Menambahkan...' : 'Tambah API Key'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setName('')
                  setKey('')
                }}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Daftar API Keys */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar API Keys ({apiKeys.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada API key. Tambahkan API key di atas.
            </p>
          ) : (
            <div className="space-y-2">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{apiKey.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {apiKey.key.slice(0, 20)}...
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Ditambahkan:{' '}
                      {new Date(apiKey.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(apiKey.id, apiKey.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

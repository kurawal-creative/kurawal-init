import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface GoogleAccount {
  id: string
  email: string
  cookie: string
  createdAt: string
  updatedAt: string
}

function GoogleAccountsPage() {
  const [email, setEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Array<GoogleAccount>>([])

  // Load accounts
  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/google-accounts?page=1&pageSize=100`)
      const result = await response.json()
      console.log('Fetch accounts result:', result)
      if (result.success && result.data) {
        setAccounts(result.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch(`/api/google-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      if (result.success) {
        alert('Akun Google berhasil ditambahkan!')
        setEmail('')
        fetchAccounts()
      } else {
        alert(`Gagal menambahkan akun: ${result.message}`)
      }
    } catch (error) {
      console.error('Error adding account:', error)
      alert('Gagal menambahkan akun Google')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (accountId: string, accountEmail: string) => {
    if (
      !confirm(
        `Hapus akun ${accountEmail}? Tindakan ini tidak dapat dibatalkan.`,
      )
    )
      return

    try {
      const response = await fetch(`/api/google-accounts/${accountId}`, {
        method: 'DELETE',
      })

      const result = await response.json()
      if (result.success) {
        alert('Akun berhasil dihapus!')
        fetchAccounts()
      } else {
        alert(`Gagal menghapus akun: ${result.message}`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Gagal menghapus akun')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Setor Akun Google</h1>
        <p className="text-muted-foreground">
          Tambahkan akun Google untuk digunakan
        </p>
      </div>

      {/* Form Tambah Akun */}
      <Card>
        <CardHeader>
          <CardTitle>Tambah Akun Google</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? 'Menambahkan...' : 'Tambah Akun'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEmail('')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Daftar Akun */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Akun Google ({accounts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada akun. Tambahkan akun Google di atas.
            </p>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{account.email}</div>
                    <div className="text-sm text-muted-foreground">
                      Ditambahkan:{' '}
                      {new Date(account.createdAt).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(account.id, account.email)}
                    >
                      🗑️ Hapus
                    </Button>
                    <div className="text-green-600 font-medium">✓ Aktif</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default GoogleAccountsPage

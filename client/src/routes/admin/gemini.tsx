import { useRef, useState } from 'react'
import {
  AlertCircle,
  Download,
  ImageIcon,
  Loader2,
  Upload,
  Wand2,
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function GeminiPage() {
  const [prompt, setPrompt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    setSelectedFile(file)
    setError('')

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey.trim()) return

    setLoading(true)
    setError('')
    setResultUrl(null)

    try {
      const blob = await apiClient.generateGeminiImage(
        selectedFile,
        prompt,
        apiKey,
      )
      const url = URL.createObjectURL(blob)
      setResultUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!resultUrl) return

    const a = document.createElement('a')
    a.href = resultUrl
    a.download = `gemini-generated-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setResultUrl(null)
    setPrompt('')
    setApiKey('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <ImageIcon className="h-6 w-6 text-white" />
          </div>
          Gemini Image Generation
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Optionally upload an image and describe what you want to generate
        </p>
      </div>

      {/* Upload & Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Create Your Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Upload Image (Optional)
            </label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? 'Change Image' : 'Select Image'}
              </Button>
              {selectedFile && (
                <Button variant="ghost" onClick={handleReset}>
                  Clear
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className="text-xs text-slate-500 mt-2">
                Selected: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="text-sm font-medium mb-2 block">
              API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="text-sm font-medium mb-2 block">
              Describe Changes
            </label>
            <Input
              id="prompt"
              placeholder="e.g., Make it more colorful, add flowers, change background to sunset"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim() || !apiKey.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating... This may take up to 1 minute
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>
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

      {/* Image Comparison */}
      {(previewUrl || resultUrl) && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Original */}
          {previewUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Input Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={previewUrl}
                  alt="Input"
                  className="w-full h-auto rounded-lg border"
                />
              </CardContent>
            </Card>
          )}

          {/* Generated */}
          {resultUrl && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Generated Image</CardTitle>
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardHeader>
              <CardContent>
                <img
                  src={resultUrl}
                  alt="Generated"
                  className="w-full h-auto rounded-lg border"
                />
                <p className="text-xs text-slate-500 mt-2">Prompt: {prompt}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Info */}
      <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
        <CardContent className="pt-6">
          <h3 className="font-medium text-purple-900 dark:text-purple-300 mb-2">
            💡 Tips for Best Results
          </h3>
          <ul className="text-sm text-purple-800 dark:text-purple-400 space-y-1">
            <li>• Image upload is optional - generate from text prompt only</li>
            <li>• Use clear, high-quality images when uploading (max 5MB)</li>
            <li>• Be specific in your prompts for best results</li>
            <li>• Generation can take 30-60 seconds</li>
            <li>• Supported formats: PNG, JPG, JPEG, WEBP</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default GeminiPage

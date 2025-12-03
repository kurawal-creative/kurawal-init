# Kurawal Init - Frontend Client

Modern admin dashboard built with React 19, TanStack Router, and Tailwind CSS 4.

## 🎨 Features

- **React 19** - Latest React with modern hooks
- **TanStack Router** - Type-safe file-based routing
- **Tailwind CSS 4** - Modern utility-first styling
- **TypeScript** - Full type safety
- **SSE** - Real-time streaming for AI responses
- **Responsive** - Mobile-first design
- **Dark Mode** - Built-in dark theme support

## 📁 Structure

```
client/
├── src/
│   ├── components/
│   │   ├── layouts/        # Layout components
│   │   │   ├── admin-layout.tsx
│   │   │   └── auth-layout.tsx
│   │   └── ui/             # Reusable UI components
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── card.tsx
│   ├── contexts/           # React contexts
│   │   └── auth-context.tsx
│   ├── lib/                # Utilities
│   │   ├── api-client.ts   # API integration
│   │   └── utils.ts        # Helper functions
│   ├── routes/             # File-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── admin.tsx
│   │   └── admin/
│   │       ├── index.tsx   # Dashboard
│   │       ├── kimi.tsx    # Kimi AI page
│   │       └── gemini.tsx  # Gemini page
│   ├── main.tsx            # Entry point
│   └── styles.css          # Global styles
└── package.json
```

## 🚀 Development

### Prerequisites
- Node.js or Bun
- Backend server running on port 3000

### Install Dependencies
```bash
bun install
# or
npm install
```

### Start Development Server
```bash
bun dev
# or
npm run dev
```

Visit: http://localhost:5173

### Build for Production
```bash
bun run build
# or
npm run build
```

Output will be in `dist/` folder.

## 🎯 Pages & Routes

### Public Routes
- `/` - Landing page (redirects based on auth status)
- `/login` - Sign in page
- `/register` - Sign up page

### Protected Routes (Requires Authentication)
- `/admin` - Dashboard overview
- `/admin/kimi` - Kimi AI assistant with SSE streaming
- `/admin/gemini` - Gemini image generation

## 🔌 API Integration

The frontend connects to the backend API via:

- **Proxy** - Development proxy configured in `vite.config.ts`
- **API Client** - Centralized API client in `lib/api-client.ts`
- **Auth Context** - Global authentication state management

### API Client Usage

```typescript
import { apiClient } from '@/lib/api-client'

// Sign in
const { user, token } = await apiClient.signIn({ email, password })

// Query Kimi (non-streaming)
const { html } = await apiClient.queryKimi({ query: 'Hello' })

// Query Kimi (streaming)
const eventSource = apiClient.kimiStream('Hello', {
  onMessage: (data) => console.log(data),
  onError: (error) => console.error(error),
  onDone: () => console.log('Done'),
  onHeartbeat: () => console.log('Heartbeat'),
})

// Generate Gemini image
const blob = await apiClient.generateGeminiImage(file, prompt)
```

## 🎨 UI Components

### Button
```tsx
import { Button } from '@/components/ui/button'

<Button variant="default" size="md">
  Click me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

### Input
```tsx
import { Input } from '@/components/ui/input'

<Input 
  type="email" 
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

## 🔐 Authentication Flow

1. User signs in via `/login`
2. Token stored in localStorage
3. API client automatically includes token in requests
4. Protected routes check auth status
5. Auto-redirect to login if unauthorized

### Using Auth Context

```tsx
import { useAuth } from '@/contexts/auth-context'

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth()
  
  // ... your component logic
}
```

## 🌊 SSE Streaming

Kimi AI uses Server-Sent Events for real-time responses:

```tsx
const eventSource = apiClient.kimiStream(query, {
  onMessage: (data: KimiStreamEvent) => {
    // data.html - current HTML content
    // data.progress - completion percentage
    // data.isComplete - whether done
  },
  onError: (error: string) => {
    // Handle errors
  },
  onDone: () => {
    // Stream completed
    eventSource.close()
  },
  onHeartbeat: () => {
    // Connection alive ping
  },
})

// Stop streaming
eventSource.close()
```

## 🎨 Styling

### Tailwind CSS 4

Uses the new Tailwind CSS 4 with CSS variables for theming.

### Dark Mode

Automatically uses system preference. Theme variables defined in `styles.css`.

### Adding Custom Components

Use the shadcn/ui pattern:

1. Create component in `components/ui/`
2. Use `cva` for variants
3. Use `cn` utility for class merging
4. Export and use

## ⚙️ Browser Pool & User Data

Backend menggunakan browser pool dengan **shared user_data directory**:

- Single `user_data/` folder untuk semua browser instances
- Cookies & sessions persisted across restarts
- Login state tetap tersimpan
- Multiple browsers dapat share data

**Benefits:**
✅ Tidak perlu login ulang setiap kali  
✅ Cookies & localStorage persisted  
✅ Lebih efisien (tidak banyak folder tmp)  
✅ Tetap support concurrent requests dengan pool

## 🔧 Configuration

### Vite Config

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3000',  // Backend proxy
    },
  },
})
```

### TypeScript

Strict mode enabled with path aliases:
- `@/*` maps to `src/*`

## 📦 Build & Deploy

### Development
```bash
bun dev
```

### Production Build
```bash
bun run build
```

### Preview Production Build
```bash
bun run serve
```

### Deploy
1. Build the project
2. Serve the `dist/` folder
3. Configure your server to serve `index.html` for all routes (SPA fallback)

## 🐛 Troubleshooting

### CORS Issues
- Make sure backend CORS is configured
- Check proxy settings in `vite.config.ts`

### Token Not Persisting
- Check localStorage in browser DevTools
- Ensure API client is setting token correctly

### Routes Not Working
- Run TanStack Router codegen: `bun run dev` (auto-runs)
- Check `routeTree.gen.ts` is generated

### SSE Not Connecting
- Verify backend is running
- Check browser Network tab for EventSource
- Ensure proper error handling

## 📝 Scripts

```json
{
  "dev": "vite",                    // Start dev server
  "build": "vite build && tsc",     // Build for production
  "serve": "vite preview",          // Preview production build
  "test": "vitest run",             // Run tests
  "lint": "eslint",                 // Lint code
  "format": "prettier",             // Format code
  "check": "prettier --write . && eslint --fix"  // Format & lint
}
```

## 🤝 Development Tips

1. **Hot Reload** - Changes auto-reload in dev mode
2. **DevTools** - TanStack Router DevTools available in dev
3. **Type Safety** - Use TypeScript for all components
4. **Components** - Reuse UI components from `components/ui/`
5. **API Client** - All API calls through `apiClient`
6. **Error Handling** - Always handle errors in try-catch
7. **Loading States** - Show loading indicators for async operations

## 📚 Resources

- [React 19 Docs](https://react.dev/)
- [TanStack Router](https://tanstack.com/router)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

## 🔗 Related

See main [README.md](../README.md) for backend setup and API documentation.

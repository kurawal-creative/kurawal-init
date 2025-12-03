# Kurawal Init - AI-Powered Web Application

Modern full-stack web application with AI integration, built with Bun, Elysia, React, and TypeScript.

## 🚀 Features

### Backend
- **Bun Runtime** - Fast JavaScript runtime
- **Elysia Framework** - Modern web framework with type safety
- **PostgreSQL + Prisma** - Type-safe database with ORM
- **JWT Authentication** - Secure token-based auth
- **AI Integration** - Gemini & Kimi AI providers
- **SSE Streaming** - Real-time streaming responses with heartbeat
- **Browser Pool** - Concurrent browser automation management
- **Rate Limiting** - API protection
- **Error Handling** - Centralized error management
- **API Documentation** - Auto-generated Swagger docs

### Frontend
- **React 19** - Latest React with hooks
- **Vite** - Fast build tool
- **TanStack Router** - Type-safe routing
- **Tailwind CSS 4** - Modern styling
- **TypeScript** - Full type safety

## 📁 Project Structure

```
kurawal-init/
├── src/
│   ├── config/              # Configuration management
│   │   └── index.ts
│   ├── middlewares/         # Global middlewares
│   │   ├── error-handler.ts
│   │   ├── logger.ts
│   │   ├── cors.ts
│   │   └── rate-limiter.ts
│   ├── modules/             # Feature modules
│   │   ├── ai/
│   │   │   ├── index.ts     # Routes (Controller)
│   │   │   ├── service.ts   # Business logic
│   │   │   ├── model.ts     # Type definitions
│   │   │   └── providers/   # AI integrations
│   │   │       ├── gemini.provider.ts
│   │   │       ├── kimi.provider.ts
│   │   │       └── types.ts
│   │   └── auth/
│   │       ├── index.ts     # Routes (Controller)
│   │       ├── service.ts   # Business logic
│   │       ├── model.ts     # Type definitions
│   │       ├── dto.ts       # Data Transfer Objects
│   │       └── middleware.ts
│   ├── lib/                 # Shared utilities
│   │   ├── browser.ts       # Browser instance management
│   │   ├── sse-helper.ts    # SSE utilities
│   │   └── prisma.ts        # Database client
│   ├── types/               # Global types
│   │   └── index.ts
│   └── index.ts             # Application entry point
├── client/                  # React frontend
├── prisma/                  # Database schema
└── temp/                    # Temporary files
```

## 🛠️ Setup

### Prerequisites
- [Bun](https://bun.sh/) >= 1.0
- PostgreSQL database
- Chrome/Chromium browser (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kurawal-init
   ```

2. **Install dependencies**
   ```bash
   bun install
   cd client && bun install && cd ..
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Generate with: `openssl rand -base64 32`
   - `PUPPETEER_EXECUTABLE_PATH` - (Optional) Path to Chrome
   - `HEADLESS` - Run browser in headless mode

4. **Database setup**
   ```bash
   bun db:generate
   bun db:push
   bun seed  # Optional: seed database
   ```

5. **Build frontend**
   ```bash
   cd client
   bun run build
   cd ..
   ```

6. **Start development server**
   ```bash
   bun dev
   ```

## 🚀 Usage

### Development
```bash
# Backend only (with hot reload)
bun dev

# Frontend only
cd client && bun dev

# Both (use separate terminals)
bun dev  # Terminal 1
cd client && bun dev  # Terminal 2
```

### Production
```bash
# Build frontend
cd client && bun run build && cd ..

# Start server
bun start
```

### Docker
```bash
docker-compose up --build
```

## 📚 API Documentation

Once the server is running, visit:
- **API Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/api/health

### Key Endpoints

#### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Login
- `GET /api/auth/profile` - Get user profile (requires auth)

#### AI
- `POST /api/ai/gemini` - Generate image with Gemini
- `POST /api/ai/kimi` - Query Kimi AI (non-streaming)
- `GET /api/ai/kimi/stream` - Query Kimi AI (SSE streaming)

### SSE Streaming Example

```javascript
const eventSource = new EventSource('/api/ai/kimi/stream?q=Hello');

eventSource.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  console.log('Content:', data.html);
  console.log('Progress:', data.progress);
});

eventSource.addEventListener('done', (e) => {
  console.log('Stream completed');
  eventSource.close();
});

eventSource.addEventListener('error', (e) => {
  console.error('Stream error:', e.data);
  eventSource.close();
});

eventSource.addEventListener('heartbeat', (e) => {
  console.log('Heartbeat:', e.data);
});
```

## 🏗️ Architecture

### Design Principles
- **Separation of Concerns** - Clear boundaries between layers
- **Type Safety** - End-to-end TypeScript
- **Error Handling** - Centralized with proper HTTP status codes
- **Security First** - Rate limiting, input validation, CORS
- **Scalability** - Browser pool, proper resource management
- **DX** - Hot reload, API docs, structured logging

### Key Improvements (v2.0)
✅ Proper separation between Controller/Service/Model  
✅ Browser pool for concurrent requests (shared user_data)  
✅ Enhanced SSE with heartbeat & error events  
✅ Rate limiting per endpoint  
✅ Comprehensive error handling  
✅ Input validation & sanitization  
✅ CORS configuration  
✅ Config management with validation  
✅ DTOs for data transformation  
✅ Auth middleware for protected routes  
✅ API documentation  
✅ Structured logging  

### Browser Pool Architecture
- **Shared User Data**: Semua browser instances menggunakan satu folder `user_data/`
- **Persistent Sessions**: Login state & cookies tersimpan antar restart
- **Concurrent Support**: Pool tetap support multiple concurrent requests
- **No Temp Pollution**: Tidak ada banyak folder `tmp/browser-*` lagi  

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - Bcrypt with cost factor 10
- **Rate Limiting** - Per-endpoint rate limits
- **Input Validation** - Elysia TypeBox validation
- **CORS** - Configurable origin whitelist
- **Error Messages** - No sensitive info leakage
- **Environment Variables** - Secure config management

## 🧪 Testing

```bash
# Run tests (when available)
bun test
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please follow the existing code structure and conventions.

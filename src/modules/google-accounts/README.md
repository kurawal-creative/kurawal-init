# Google Accounts Module

Modul untuk mengelola akun Google dengan fitur otomatis login menggunakan browser automation dan handling security challenge via SSE (Server-Sent Events).

## Fitur

- ✅ CRUD akun Google (Create, Read, Update, Delete)
- ✅ Pagination untuk list akun
- ✅ Otomatis login Google via browser automation
- ✅ Handle security challenge (OTP/2FA) via SSE
- ✅ Real-time notification challenge ke client
- ✅ Simpan cookie session untuk reuse

## Endpoints

### 1. List Accounts (dengan Pagination)
```
GET /google-accounts?page=1&pageSize=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "email": "user@gmail.com",
        "cookie": "[...]",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10
  }
}
```

### 2. Create Account (dengan Auto Login)
```
POST /google-accounts
Content-Type: application/json

{
  "email": "user@gmail.com",
  "password": "password123"
}
```

**Proses:**
1. Browser automation buka Google login
2. Input email & password otomatis
3. Jika ada security challenge (OTP/2FA):
   - Challenge disimpan ke memory store
   - Broadcast ke client via SSE
   - Tunggu client input kode (polling)
   - Input kode ke browser automation
4. Ambil cookie setelah login sukses
5. Simpan ke database

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@gmail.com",
    "cookie": "[...]",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Get Account by ID
```
GET /google-accounts/:id
```

### 4. Delete Account
```
DELETE /google-accounts/:id
```

### 5. SSE Stream Challenge
```
GET /google-accounts/challenge/stream
```

**EventSource di Client:**
```javascript
const es = new EventSource('http://localhost:3000/google-accounts/challenge/stream');
es.onmessage = (event) => {
  const challenge = JSON.parse(event.data);
  console.log(challenge);
  // { email: "user@gmail.com", type: "security_code", timestamp: 1234567890 }
};
```

### 6. Submit Challenge Code
```
POST /google-accounts/challenge/code
Content-Type: application/json

{
  "email": "user@gmail.com",
  "code": "123456"
}
```

## Workflow Challenge Handling

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Service   │         │   Backend   │         │   Client    │
│ (Automation)│         │   (API)     │         │  (Admin)    │
└──────┬──────┘         └──────┬──────┘         └──────┬──────┘
       │                       │                       │
       │ 1. Detect Challenge   │                       │
       ├──────────────────────>│                       │
       │                       │                       │
       │                       │ 2. Broadcast via SSE  │
       │                       ├──────────────────────>│
       │                       │                       │
       │                       │      3. Input Code    │
       │                       │<──────────────────────┤
       │                       │                       │
       │ 4. Polling Code       │                       │
       │<──────────────────────┤                       │
       │                       │                       │
       │ 5. Input ke Browser   │                       │
       └───────────────────────┘                       │
                                                       │
```

## Client UI

Buka file `public/challenge-client.html` di browser untuk monitor challenge secara real-time.

**URL:**
```
http://localhost:3000/challenge-client.html
```

**Fitur Client:**
- Real-time monitor challenge via SSE
- Tampilan daftar challenge aktif
- Form input kode challenge
- Toast notification

## Environment Variables

```env
# Browser pool configuration (di config)
BROWSER_POOL_SIZE=3
PUPPETEER_EXECUTABLE_PATH=C:/Program Files/Google/Chrome/Application/chrome.exe
PUPPETEER_HEADLESS=false
```

## Dependencies

- `puppeteer-core` - Browser automation
- `@prisma/client` - Database ORM
- `elysia` - Web framework

## Storage

### Challenge Store (`@/lib/challenge-store`)

In-memory storage untuk challenge dan kode:

```typescript
import { challengeStore } from "@/lib/challenge-store";

// Simpan challenge
challengeStore.storeChallenge(email, "security_code");

// Simpan kode dari client
challengeStore.storeCode(email, "123456");

// Ambil kode (untuk polling)
const code = challengeStore.getCode(email); // return null jika belum ada

// Clear challenge
challengeStore.clear(email);
```

**Auto cleanup:** Challenge lebih dari 5 menit otomatis dihapus.

## Database Schema

```prisma
model GoogleAccount {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  cookie    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## Security Notes

⚠️ **IMPORTANT:**
- Password disimpan plain text (untuk development). Di production, WAJIB hash password sebelum simpan!
- Cookie disimpan sebagai JSON string untuk reuse session.
- Challenge store in-memory, tidak persist ke database.
- SSE connection keep-alive 30 detik.

## Best Practices

1. **Browser Pool:** Gunakan browser pool untuk efisiensi resource.
2. **SSE Cleanup:** Pastikan client close EventSource saat tidak digunakan.
3. **Polling Timeout:** Service polling max 1 menit, setelah itu throw error.
4. **Challenge Cleanup:** Auto cleanup setiap 1
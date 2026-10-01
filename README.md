# CampusHub

校園論壇/部落格平台 — 用戶可發布文章、留言、按讚，支援分類與標籤系統。

## 技術棧

| 層 | 技術 |
|---|---|
| 後端 | ASP.NET Core + EF Core + SQLite |
| 前端 | React 18 + TypeScript + Vite + Zustand |
| 認證 | JWT + ASP.NET Identity |
| 測試 | xUnit |

## 專案結構

```
CampusHub/
├── src/                          # 後端（.NET DDD 架構）
│   ├── CampusHub.Api/            # 進入點：Controllers、Program.cs、JWT 設定
│   ├── CampusHub.Application/    # 應用層：Services、DTOs、Interfaces
│   ├── CampusHub.Domain/         # 領域層：Entities、Enums
│   └── CampusHub.Infrastructure/  # 基礎設施：EF Core、Data、AuthService
├── frontend/                     # 前端（React + Vite）
│   └── src/
│       ├── pages/                # 頁面元件（10 個）
│       ├── components/           # 共用元件
│       ├── store/                # Zustand 狀態管理
│       ├── services/             # API 呼叫（api.ts）
│       └── types/                # TypeScript 型別
├── CampusHub.Tests/              # 測試專案
└── ARCHITECTURE.md               # 架構文件
```

## 快速啟動

### 後端

```bash
cd src/CampusHub.Api
dotnet restore
dotnet run
```

API 監聽 `http://localhost:7001`

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端監聽 `http://localhost:5173`

## 資料模型

- **User** — 用戶（IdentityUser + Avatar + Role）
- **Post** — 文章（Title, Content, Excerpt, Category, Tags）
- **Comment** — 留言（支援巢狀回覆）
- **Category** — 分類（6 個預設分類）
- **Tag** — 標籤（8 個預設標籤）
- **Like** — 按讚（Post 或 Comment）
- **RefreshToken** — JWT 刷新令牌

## API 端點

| Controller | 用途 |
|---|---|
| AuthController | 登入/註冊/刷新 token/登出 |
| PostsController | 文章 CRUD + 按讚 + 留言 |
| CommentsController | 留言管理 |
| CategoriesController | 分類管理 |
| TagsController | 標籤管理 |
| SearchController | 搜尋 |

## 認證流程

1. 用戶登入 → 核發 JWT access token + refresh token
2. Access token 存放於 HttpOnly cookie
3. 請求時從 cookie 或 Authorization header 讀取 token
4. Token 過期時用 refresh token 換新（前端 axios 攔截器自動處理）

## 開發規範

- 註解使用繁體中文，只寫「為什麼」不寫「是什麼」
- 每個檔案頂部用 1-2 行說明用途
- 複雜邏輯必須有註解解釋原因
- 詳細規則見 `.sisyphus/RULES.md`

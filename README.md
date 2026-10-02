# CampusHub

課程協作平台 — 課程、筆記、討論、任務，JWT 認證，SQL Server。

## 技術棧

| 層 | 技術 |
|---|---|
| 後端 | ASP.NET Core (net10.0) + EF Core Code First + SQL Server 2022 |
| 前端 | React 18 + TypeScript + Vite + Zustand |
| 認證 | JWT + ASP.NET Identity |
| DB | Docker `campushub-sqlserver`，port 1433 |

## 專案結構

```
CampusHub/
├── backend/
│   ├── CampusHub.Api/            # Controllers、Program.cs、JWT、DI
│   ├── CampusHub.Application/    # Services、DTOs、Interfaces
│   ├── CampusHub.Domain/         # Entities、Enums
│   └── CampusHub.Infrastructure/ # EF Core DbContext、TokenService、AuthService
├── frontend/                     # React + Vite
├── database/                     # 參考 SQL schema（EF EnsureCreated 為實際來源）
├── docker-compose.yml            # SQL Server 容器
└── CampusHub.slnx
```

## 快速啟動

### SQL Server

```bash
docker compose up -d
```

sa 密碼：`CampusHubDev123!`，連線字串在 `backend/CampusHub.Api/appsettings.json`。

### 後端

```bash
cd backend/CampusHub.Api
dotnet restore
dotnet run
```

啟動時 `EnsureCreated()` 自動建 schema。API 監聽 `http://localhost:7001`（見 launchSettings）。

### 前端

```bash
cd frontend
npm install
npm run dev
```

## 資料模型

- **User** — IdentityUser + Name + CreatedAt + CourseMemberships
- **Course** — 課程（Name, Code, Description）
- **CourseMember** — 課程成員（CourseId+UserId 複合 PK, Role: Owner/TA/Member）
- **Note** — 課程筆記（Title, Content, AuthorId）
- **Post** — 討論文（Title, Content, AuthorId, Comments）
- **Comment** — 留言（PostId, AuthorId, Content）
- **TaskItem** — 任務（Title, Description, Status: Todo/Doing/Done, AssigneeId, DueDate，表名 `Tasks`）
- **RefreshToken** — JWT 刷新令牌

## API 端點

| Controller | 用途 |
|---|---|
| AuthController | 註冊/登入/刷新 token/登出（匿名） |
| CoursesController | 課程 CRUD、成員管理（需登入） |
| NotesController | 筆記 CRUD（需登入） |
| PostsController | 討論文 CRUD（需登入） |
| CommentsController | 留言（需登入） |
| TasksController | 任務 CRUD（需登入） |

## 認證流程

1. 登入 → JWT access token + refresh token（HttpOnly cookie）
2. 請求帶 `Authorization: Bearer <token>` 或 cookie
3. Token 過期用 refresh token 換新

## 開發規範

- 註解使用繁體中文，只寫「為什麼」不寫「是什麼」
- 每個檔案頂部用 1-2 行說明用途
- 複雜邏輯必須有註解解釋原因
- Schema 由 EF Core Code First 管理，`database/*.sql` 僅供參考

# CampusHub

課程協作平台 — 課程、筆記、討論、任務，JWT 認證，SQL Server。

## 技術棧

| 層 | 技術 |
|---|---|
| 後端 | ASP.NET Core (net10.0) + EF Core Code First + SQL Server 2022 |
| 前端 | React 19 + TypeScript + Vite + React Router + Zustand |
| 認證 | JWT + ASP.NET Identity |
| DB | Docker `campushub-sqlserver`，port 1433 |

## 專案結構

```
CampusHub/
├── backend/
│   ├── CampusHub.Api/            # Controllers、Program.cs、JWT、DI
│   ├── CampusHub.Application/    # Services、DTOs、Interfaces
│   ├── CampusHub.Application.Tests/ # Application service 測試
│   ├── CampusHub.Domain/         # Entities、Enums
│   └── CampusHub.Infrastructure/ # EF Core DbContext、TokenService、AuthService
├── frontend/                     # React + Vite；課程/成員前端已對接新 API
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

### 課程與成員

| Method | Path | 用途 | 權限 |
|---|---|---|---|
| POST | `/api/courses` | 建立課程；建立者成為 Owner | 登入者 |
| GET | `/api/courses/mine` | 查詢自己加入的課程 | 登入者 |
| GET | `/api/courses/{id}` | 查看課程 | 課程成員 |
| PUT | `/api/courses/{id}` | 修改名稱與說明 | Owner |
| POST | `/api/courses/join` | 使用課程 Code 直接加入 | 登入者 |
| GET | `/api/courses/{id}/members` | 查詢成員 | 課程成員 |
| POST | `/api/courses/{id}/members` | 指定使用者加入 | Owner；TA 只能新增 Member |
| PATCH | `/api/courses/{id}/members/{memberId}/role` | 在 TA、Member 間修改角色 | Owner |
| DELETE | `/api/courses/{id}/members/{memberId}` | 移除成員 | Owner；TA 只能移除 Member |
| DELETE | `/api/courses/{id}/members/me` | 自行退出 | TA、Member |

課程 Code 寫入及查詢時統一 `Trim()` 與轉大寫，例如 ` cs101 ` 會視為 `CS101`。Owner 不可退出、被移除或直接轉讓。

### 課程前端

- `/courses`：我的課程列表、建立課程、使用 Code 加入課程
- `/courses/:id`：課程資訊、成員列表、Owner/TA 權限操作、TA/Member 自行退出
- `courseService`：封裝 CoursesController 對應 API；請求沿用全域 Axios JWT interceptor
- 課程頁面位於登入保護路由下；Header 提供「課程」入口

## 認證流程

1. 登入 → JWT access token + refresh token（HttpOnly cookie）
2. 請求帶 `Authorization: Bearer <token>` 或 cookie
3. Token 過期用 refresh token 換新

## 開發規範

- 以 `C:\Users\RS\.codex\AGENTS.md` 為全域開發規範來源，專案狀態同步維護在 README、`docs/PROJECT_SPEC.md` 與專案記憶
- 遵守 Clean Code：命名清楚、方法單一職責、流程可讀，避免重複與不必要抽象
- 功能、業務方法與 helper 使用簡短繁體中文目的註解；非直覺邏輯補充原因或限制
- 註解放在對應程式碼行尾，保持簡短清楚
- 權限限制、非直覺查詢與儲存契約需註解說明，避免逐行重述程式碼
- 有意義的實作變更必須同步 README 或 `docs/PROJECT_SPEC.md`，保持可交接
- 完成前執行適用的 build、test、lint、typecheck；若受既有問題阻擋，要明確記錄驗證邊界
- Git commit 使用含 scope 的 Conventional Commits，例如 `feat(campushub): ...`
- Schema 由 EF Core Code First 管理，`database/*.sql` 僅供參考

## 驗證

```bash
dotnet build CampusHub.slnx
dotnet test backend/CampusHub.Application.Tests/CampusHub.Application.Tests.csproj
```

課程測試使用 SQLite in-memory，不需要啟動 SQL Server。

前端目前 `npx vite build` 可成功產生 production bundle；`npm run build` 的全專案 TypeScript 檢查仍被既有舊 forum/UI 型別錯誤阻擋，Course 新頁面未出現在目前的 typecheck 錯誤清單。

# CampusHub PROJECT_SPEC

## 目的
校園課程協作平台：課程、筆記、討論、任務管理。後端 ASP.NET Core + EF Core Code First，前端 React 19 + TypeScript + Vite。

## 架構
- Domain：Entities/Enums 純 POCO，無 EF 依賴
- Application：IApplicationDbContext、IServices、DTOs、ServiceResult、Services（5 個：Course/Note/Post/Comment/TaskService）
- Infrastructure：CampusHubDbContext（IdentityDbContext）、EntityConfigurations、AuthService、TokenService
- Api：Controllers（Auth 匿名，其餘 [Authorize]）、Program.cs（UseSqlServer、CORS、JWT、EnsureCreated）
- Frontend：React Router + Axios + Zustand；`/courses` 提供課程建立/加入/列表，`/courses/:id` 提供課程資訊與成員管理

## 資料流
Frontend → Axios `courseService` → CoursesController → ICourseService → IApplicationDbContext(EF) → SQL Server。EnsureCreated 啟動建 14 表；JWT access token 由 Axios interceptor 附加。

## 關鍵決策
- Docker 首次建立 `CampusHub` 資料庫時執行 `database/CampusHub_CreateDatabase.sql`；既有 volume 不重複初始化
- TaskItem 類別名避開 System.Threading.Tasks.Task 衝突，表名 `Tasks`
- CourseMember 複合 PK (CourseId, UserId)
- 課程 Code 去除頭尾空白並轉大寫；學生輸入 Code 後直接加入，不經審核
- ServiceResult 將業務失敗映射為 400/403/404/409，避免用 null 或 bool 混淆原因
- RefreshToken 單純表，非 Identity 欄位
- SQL Server 2022 Docker，sa 密碼 CampusHubDev123!，port 1433

## 驗證
- `dotnet build CampusHub.slnx --no-restore`：0 errors、0 warnings
- `dotnet test backend/CampusHub.Application.Tests/CampusHub.Application.Tests.csproj`：5 passed
- Smoke test：register → login → POST /api/courses 通過
- `npx vite build`：成功，2155 modules transformed；僅有單一 bundle 超過 500 kB 的 warning
- `npm run build`：目前被既有前端 TypeScript 錯誤阻擋；主要集中在舊 forum/UI 元件、`Button asChild` 契約、舊 import 路徑與 Axios interceptor 型別，Course 新頁面本身未出現在錯誤清單
- `npm run lint`：0 errors、42 warnings；多數為既有舊 forum/UI 問題，`CoursesPage` 另有 React `set-state-in-effect` warning，未阻擋 production bundle

## 已知限制
- 無 migration；改 schema 需 drop DB 重建或導入 EF Migrations
- 無 refresh token rotation/撤銷嚴格檢查
- 課程/成員前端已對接新 API；筆記、討論、留言、任務前端仍沿用舊 forum 結構或尚未完成新 API 對接
- 課程管理已有 Application service 測試；其餘模組尚無測試
- 前端全專案 TypeScript typecheck 尚未通過；在開始第 4 項筆記前，應先決定是否整理舊 forum 前端或逐步以新 Course-aware 頁面取代

## 課程管理與成員管理

### 開發紀錄
- CourseService 每個業務方法與輔助方法補上用途註解；使用簡短繁體中文行尾註解，同時保留必要的規則與限制說明。
- CourseService 整體 Clean Code 整理：統一 guard clause 大括號、展開成員初始化、共用 FindMemberAsync 與角色解析，使用 targetRole 區分目標角色；保留檢查順序、錯誤訊息及角色解析行為。
- 補上 CoursesController 簡短繁體中文行尾註解，說明端點用途、角色限制、HTTP 映射及登入身分來源。
- CourseService 可讀性重構：共用成員管理權限判斷、拆開非成員錯誤分支、展開查詢與 DTO 映射；不變更 API 契約。
- 補上 CourseService 繁體中文行尾註解，說明角色權限、直接加入、nullable 查詢、儲存及 DTO 邊界。
- 註解保持簡短清楚，優先解釋原因與限制；交接文件隨程式同步更新。

### 模組責任
- `Domain/Entities/Course.cs`：Course 與 CourseMember 資料模型
- `Domain/Enums/Enums.cs`：Owner、TA、Member 角色定義
- `Application/DTOs/CourseDtos.cs`：課程及成員 API 輸入輸出
- `Application/Services/CourseService.cs`：Code 正規化、成員資格及角色權限規則
- `Application/Common/ServiceResult.cs`：業務結果與 HTTP 狀態間的明確契約
- `Api/Controllers/Api/CoursesController.cs`：JWT 使用者識別、route 與 HTTP 回應映射
- `Application.Tests/CourseServiceTests.cs`：SQLite in-memory 權限及加入流程測試
- `frontend/src/pages/CoursesPage.tsx`：我的課程、建立課程、Code 加入課程
- `frontend/src/pages/CourseDetailPage.tsx`：課程資訊與 Owner/TA/Member 成員管理介面
- `frontend/src/services/api.ts`：`courseService` 封裝課程/成員 API
- `frontend/src/App.tsx`：課程路由與登入保護

### 權限矩陣
| 操作 | Owner | TA | Member | 非成員 |
|---|---:|---:|---:|---:|
| 查看課程/成員 | 是 | 是 | 是 | 否 |
| 修改課程 | 是 | 否 | 否 | 否 |
| 新增 TA | 是 | 否 | 否 | 否 |
| 新增/移除 Member | 是 | 是 | 否 | 否 |
| 修改 TA/Member 角色 | 是 | 否 | 否 | 否 |
| 自行退出 | 否 | 是 | 是 | 不適用 |

每門課只有一位 Owner。Owner 不可退出、移除或透過一般角色 API 轉讓；若未來需要轉移擁有權，必須新增獨立交易流程。

### API
| Method | Route | 成功狀態 |
|---|---|---:|
| POST | `/api/courses` | 200 |
| GET | `/api/courses/{id}` | 200 |
| GET | `/api/courses/mine` | 200 |
| PUT | `/api/courses/{id}` | 200 |
| POST | `/api/courses/join` | 204 |
| GET | `/api/courses/{id}/members` | 200 |
| POST | `/api/courses/{id}/members` | 204 |
| PATCH | `/api/courses/{id}/members/{memberId}/role` | 204 |
| DELETE | `/api/courses/{id}/members/{memberId}` | 204 |
| DELETE | `/api/courses/{id}/members/me` | 204 |

錯誤狀態：輸入或規則錯誤 `400`、無權限 `403`、資源不存在 `404`、重複 Code/成員/角色 `409`。

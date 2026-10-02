# CampusHub PROJECT_SPEC

## 目的
校園課程協作平台：課程、筆記、討論、任務管理。後端 ASP.NET Core + EF Core Code First，前端 React 18 + Vite。

## 架構
- Domain：Entities/Enums 純 POCO，無 EF 依賴
- Application：IApplicationDbContext、IServices、DTOs、Services（5 個：Course/Note/Post/Comment/TaskService）
- Infrastructure：CampusHubDbContext（IdentityDbContext）、EntityConfigurations、AuthService、TokenService
- Api：Controllers（Auth 匿名，其餘 [Authorize]）、Program.cs（UseSqlServer、CORS、JWT、EnsureCreated）

## 資料流
Controller → IService → IApplicationDbContext(EF) → SQL Server。EnsureCreated 啟動建 14 表。

## 關鍵決策
- Schema 以 EF Core Code First 為準；`database/*.sql` 僅參考
- TaskItem 類別名避開 System.Threading.Tasks.Task 衝突，表名 `Tasks`
- CourseMember 複合 PK (CourseId, UserId)
- RefreshToken 單純表，非 Identity 欄位
- SQL Server 2022 Docker，sa 密碼 CampusHubDev123!，port 1433

## 驗證
- `dotnet build CampusHub.slnx`：0 errors, 3 warnings（HasCheckConstraint obsolete、Users hides Identity、TaskStatus ambiguity 已用 alias）
- Smoke test：register → login → POST /api/courses 通過

## 已知限制
- 無 migration；改 schema 需 drop DB 重建或導入 EF Migrations
- 無 refresh token rotation/撤銷嚴格檢查
- 前端尚未對接新 API（仍為舊 forum 模型）
- 無測試專案

# CampusHub 開發日誌

## 2026-10-10｜簡化使用者認證與資料庫結構

### 修改原因
原始 `dbo.Users` 已有 `User_Id`、`Name`、`Email`、`PasswordHash`、`CreatedAt`，目前前後端只需使用 Email 註冊、登入及姓名顯示，不需要獨立 Username，也不需要完整 ASP.NET Core Identity 使用者資料表。

### 本次修改
- `backend/CampusHub.Domain/Entities/User.cs`：將 `User` 從 `IdentityUser<Guid>` 改為一般實體，保留原本五個資料欄位及關聯。
- `backend/CampusHub.Infrastructure/Data/CampusHubDbContext.cs`：從 `IdentityDbContext` 改為一般 `DbContext`，避免預設 Identity 資料表映射。
- `backend/CampusHub.Infrastructure/Configurations/EntityConfigurations.cs`：將 `User` 對應到 `dbo.Users`，並將 `Id` 對應 `User_Id`；保留 Email 唯一性設定。
- `backend/CampusHub.Infrastructure/Services/AuthService.cs`：改用 EF Core 查詢 Email，透過 `IPasswordHasher<User>` 建立與驗證密碼雜湊；維持原有密碼複雜度政策、JWT 登入、Refresh Token 換發及登出撤銷流程。
- `backend/CampusHub.Infrastructure/Services/TokenService.cs`：JWT 的 Name Claim 改用 `User.Name`。
- `backend/CampusHub.Api/Program.cs`：移除完整 `AddIdentity` 註冊，改註冊 `PasswordHasher<User>`。
- `backend/CampusHub.Application/DTOs/AuthDtos.cs`：移除註冊要求的 `Username` 及使用者回傳 DTO 的 `Username`。
- `backend/CampusHub.Api/Controllers/Api/AuthController.cs`：註冊 API 改為 Email、密碼、姓名；使用者回應不再包含 Username。
- `backend/CampusHub.Api/Controllers/Api/UsersController.cs`：個人資料讀取與姓名更新改為使用 EF Core，不再依賴 `UserManager<User>`。
- `backend/CampusHub.Application.Tests/CourseServiceTests.cs`：調整測試使用者建立方式，不再設定 Username。
- `database/CampusHub_AddAuthenticationTables.sql`：改為只建立 `dbo.RefreshTokens` 及 Token 查詢索引；不新增 `Users` 欄位、不建立 AspNet 前綴資料表。SQL 的欄位及索引均附中文註解。

### 驗證
- 已執行 `dotnet test CampusHub.slnx --nologo -v:q`：5 個測試通過，0 個失敗。
- 尚未對實際 SQL Server 執行新增表腳本或完成真實登入整合測試。
- 前端註冊表單與 API 型別尚未同步調整，若仍傳送 Username，需要另外修改。
- 原本的 `CampusHub_CreateDatabase.sql` 未修改。

### 後續事項
- 在正確的 CampusHub SQL Server 資料庫執行 `CampusHub_AddAuthenticationTables.sql`（僅一次）。
- 調整前端註冊欄位，移除獨立 Username。
- 測試註冊、登入、換發 Token、登出及個人資料修改。
- 檢查其他業務實體與既有 SQL schema 的欄位名稱、外鍵及列舉型別是否一致。

> 注意：本次採用 Identity 的密碼雜湊器，但不使用 Identity 的完整使用者管理與資料表模型；舊帳號的密碼雜湊必須與 PasswordHasher 相容才能直接登入。

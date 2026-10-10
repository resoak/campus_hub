-- CampusHub 最小使用者系統擴充：優先沿用 Users，僅新建 RefreshTokens。
-- 本檔只提供 SQL；由使用者在 SSMS 選擇 CampusHub 後自行執行。
-- 範圍：目前的註冊、登入、個人資料、JWT refresh/logout 流程。
-- Users 新增 12 個 Identity 欄位；原 User_Id、Name、Email、PasswordHash、CreatedAt 保留。
-- RefreshTokens 為使用者的一對多登入紀錄，不能以 Users 單一欄位完整取代。
-- 不建立 AspNetUsers、角色、Claims、外部登入、Identity Tokens 或 Passkeys 表。
-- 日後若啟用上述 Identity 功能，需另行補表；本檔不是完整 Identity schema。
-- 必要程式碼配合（目前尚未修改）：
--   UserConfiguration: builder.ToTable("Users");
--   builder.Property(u => u.Id).HasColumnName("User_Id");
--   Email 與 PasswordHash 對應既有欄位的必填／長度設定。
-- 僅執行 SQL 不會改變後端預設讀取 AspNetUsers 的行為，也不會單獨解決登入 500。
-- 舊 PasswordHash 必須相容 ASP.NET Identity 才可直接登入；不修改既有密碼。
-- 舊帳號缺少 UserName 時以 Email 補入；保留原主鍵及業務表外鍵。
-- 可重複執行；失敗會回滾整個交易。既有 RefreshTokens 若結構不符，須另行處理。
-- 成功後回復：先備份，回復後端版本並保留新增欄位／表，避免遺失新資料。
-- 本檔不處理課程、文章等業務表的欄位相容性。

USE [CampusHub];
GO
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.AspNetUsers', N'U') IS NOT NULL
        THROW 50004, N'已存在 AspNetUsers，請先確認舊版腳本的帳號與外鍵遷移，避免混用兩套使用者。', 1;

    IF OBJECT_ID(N'dbo.Users', N'U') IS NULL OR COL_LENGTH(N'dbo.Users', N'User_Id') IS NULL
        THROW 50001, N'需要原有 dbo.Users 與 User_Id 欄位。', 1;

    DECLARE @Columns TABLE (ColumnName SYSNAME, Definition NVARCHAR(500));
    INSERT INTO @Columns VALUES
        (N'UserName', N'NVARCHAR(256) NULL'),
        (N'NormalizedUserName', N'NVARCHAR(256) NULL'),
        (N'NormalizedEmail', N'NVARCHAR(256) NULL'),
        (N'EmailConfirmed', N'BIT NOT NULL DEFAULT (0) WITH VALUES'),
        (N'SecurityStamp', N'NVARCHAR(MAX) NULL'),
        (N'ConcurrencyStamp', N'NVARCHAR(MAX) NULL'),
        (N'PhoneNumber', N'NVARCHAR(MAX) NULL'),
        (N'PhoneNumberConfirmed', N'BIT NOT NULL DEFAULT (0) WITH VALUES'),
        (N'TwoFactorEnabled', N'BIT NOT NULL DEFAULT (0) WITH VALUES'),
        (N'LockoutEnd', N'DATETIMEOFFSET NULL'),
        (N'LockoutEnabled', N'BIT NOT NULL DEFAULT (1) WITH VALUES'),
        (N'AccessFailedCount', N'INT NOT NULL DEFAULT (0) WITH VALUES');
    DECLARE @ColumnName SYSNAME, @Definition NVARCHAR(500), @Sql NVARCHAR(MAX);
    DECLARE MissingColumns CURSOR LOCAL FAST_FORWARD FOR SELECT ColumnName, Definition FROM @Columns;
    OPEN MissingColumns;
    FETCH NEXT FROM MissingColumns INTO @ColumnName, @Definition;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        IF COL_LENGTH(N'dbo.Users', @ColumnName) IS NULL
        BEGIN
            SET @Sql = N'ALTER TABLE dbo.Users ADD ' + QUOTENAME(@ColumnName) + N' ' + @Definition;
            EXEC sys.sp_executesql @Sql;
        END;
        FETCH NEXT FROM MissingColumns INTO @ColumnName, @Definition;
    END;
    CLOSE MissingColumns;
    DEALLOCATE MissingColumns;

    -- 動態 SQL 避免在新增欄位前編譯；舊帳號以 Email 作為初始 UserName。
    EXEC sys.sp_executesql N'
        UPDATE dbo.Users SET
            UserName = COALESCE(UserName, Email),
            SecurityStamp = COALESCE(SecurityStamp, CONVERT(NVARCHAR(36), NEWID())),
            ConcurrencyStamp = COALESCE(ConcurrencyStamp, CONVERT(NVARCHAR(36), NEWID()));
        UPDATE dbo.Users SET
            NormalizedUserName = COALESCE(NormalizedUserName, UPPER(UserName)),
            NormalizedEmail = COALESCE(NormalizedEmail, UPPER(Email));
        IF EXISTS (SELECT NormalizedEmail FROM dbo.Users WHERE NormalizedEmail IS NOT NULL
                   GROUP BY NormalizedEmail HAVING COUNT(*) > 1)
            THROW 50003, N''Email 正規化後有重複，請先處理；本次變更會回滾。'', 1;
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N''dbo.Users'') AND name = N''UserNameIndex'')
            CREATE UNIQUE INDEX UserNameIndex ON dbo.Users(NormalizedUserName) WHERE NormalizedUserName IS NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N''dbo.Users'') AND name = N''EmailIndex'')
            CREATE UNIQUE INDEX EmailIndex ON dbo.Users(NormalizedEmail) WHERE NormalizedEmail IS NOT NULL;
        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N''dbo.Users'') AND name = N''IX_Users_UserName'')
            CREATE UNIQUE INDEX IX_Users_UserName ON dbo.Users(UserName) WHERE UserName IS NOT NULL;
    ';

    IF OBJECT_ID(N'dbo.RefreshTokens', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.RefreshTokens (
            Id UNIQUEIDENTIFIER NOT NULL,
            Token NVARCHAR(500) NOT NULL,
            UserId UNIQUEIDENTIFIER NOT NULL,
            ExpiresAt DATETIME2 NOT NULL,
            CreatedAt DATETIME2 NOT NULL,
            IsRevoked BIT NOT NULL,
            CONSTRAINT PK_RefreshTokens PRIMARY KEY (Id),
            CONSTRAINT FK_RefreshTokens_Users_UserId
                FOREIGN KEY (UserId) REFERENCES dbo.Users(User_Id) ON DELETE CASCADE
        );
        CREATE UNIQUE INDEX IX_RefreshTokens_Token ON dbo.RefreshTokens(Token);
        CREATE INDEX IX_RefreshTokens_UserId ON dbo.RefreshTokens(UserId);
        CREATE INDEX IX_RefreshTokens_ExpiresAt ON dbo.RefreshTokens(ExpiresAt);
    END;

    COMMIT TRANSACTION;
    PRINT N'Users 欄位及 RefreshTokens 已補齊；請配合後端映射設定。';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- CampusHub：沿用既有 Users，不新增使用者欄位
-- 先執行 CampusHub_CreateDatabase.sql；本檔只需執行一次。

USE CampusHub;
GO

-- 重新整理權杖：支援 JWT 換發與登出
CREATE TABLE dbo.RefreshTokens (
    Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RefreshTokens_Id DEFAULT NEWSEQUENTIALID(), -- 權杖紀錄主鍵
    Token      NVARCHAR(500)    NOT NULL, -- Refresh Token 字串
    UserId     UNIQUEIDENTIFIER NOT NULL, -- 對應既有 Users.User_Id
    ExpiresAt  DATETIME2(7)     NOT NULL, -- 權杖到期時間（UTC）
    CreatedAt  DATETIME2(7)     NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAt DEFAULT SYSUTCDATETIME(), -- 建立時間（UTC）
    IsRevoked  BIT              NOT NULL CONSTRAINT DF_RefreshTokens_IsRevoked DEFAULT (0), -- 是否已撤銷：0=否、1=是
    CONSTRAINT PK_RefreshTokens PRIMARY KEY (Id),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(User_Id) ON DELETE CASCADE
);
GO

-- 權杖查詢索引
CREATE UNIQUE INDEX IX_RefreshTokens_Token ON dbo.RefreshTokens(Token); -- 依 Token 查詢並確保不重複
CREATE INDEX IX_RefreshTokens_UserId ON dbo.RefreshTokens(UserId); -- 查詢使用者的權杖
CREATE INDEX IX_RefreshTokens_ExpiresAt ON dbo.RefreshTokens(ExpiresAt); -- 依到期時間查詢
GO

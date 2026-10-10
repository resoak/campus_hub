-- CampusHub SQL Server 初始化腳本
-- 依目前 backend/CampusHub.Domain/Entities 與 EntityConfigurations.cs 設計。
-- 用於「全新／空白」CampusHub 資料庫：一次建立全部資料表、約束、索引。
-- 既有資料庫請使用增量腳本，不要重複執行本檔；本檔不會刪除任何表。
-- 只有 Users 主鍵沿用原有 User_Id，其餘欄位名稱配合目前 EF Core 的預設映射。

IF DB_ID(N'CampusHub') IS NULL
    CREATE DATABASE CampusHub;
GO

USE CampusHub;
GO

CREATE TABLE dbo.Users (
    User_Id      UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_UserId DEFAULT NEWSEQUENTIALID(), -- 使用者識別碼（C# User.Id）
    Name         NVARCHAR(100)    NOT NULL, -- 使用者姓名、顯示名稱
    Email        NVARCHAR(256)    NOT NULL, -- 登入 Email，不可重複
    PasswordHash NVARCHAR(512)    NOT NULL, -- 密碼雜湊，不儲存明文密碼
    CreatedAt    DATETIME2(0)     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(), -- 註冊時間（UTC）
    CONSTRAINT PK_Users PRIMARY KEY (User_Id),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);

CREATE TABLE dbo.Courses (
    Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Courses_Id DEFAULT NEWSEQUENTIALID(), -- 課程識別碼
    Name        NVARCHAR(200)    NOT NULL, -- 課程名稱
    Code        NVARCHAR(50)     NOT NULL, -- 加入課程用代碼，不可重複
    Description NVARCHAR(1000)   NULL, -- 課程說明
    CONSTRAINT PK_Courses PRIMARY KEY (Id),
    CONSTRAINT UQ_Courses_Code UNIQUE (Code)
);

CREATE TABLE dbo.CourseMembers (
    CourseId UNIQUEIDENTIFIER NOT NULL, -- 所屬課程
    UserId   UNIQUEIDENTIFIER NOT NULL, -- 所屬使用者
    Role     INT              NOT NULL CONSTRAINT DF_CourseMembers_Role DEFAULT (2), -- 課程角色
    JoinedAt DATETIME2(7)     NOT NULL CONSTRAINT DF_CourseMembers_JoinedAt DEFAULT SYSUTCDATETIME(), -- 加入時間（UTC）
    CONSTRAINT PK_CourseMembers PRIMARY KEY (CourseId, UserId),
    CONSTRAINT FK_CourseMembers_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id) ON DELETE CASCADE,
    CONSTRAINT FK_CourseMembers_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(User_Id) ON DELETE CASCADE,
    CONSTRAINT CK_CourseMember_Role CHECK (Role IN (0, 1, 2))
);

CREATE TABLE dbo.Notes (
    Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Notes_Id DEFAULT NEWSEQUENTIALID(), -- 筆記識別碼
    CourseId  UNIQUEIDENTIFIER NOT NULL, -- 所屬課程
    AuthorId  UNIQUEIDENTIFIER NOT NULL, -- 筆記作者
    Title     NVARCHAR(200)    NOT NULL, -- 筆記標題
    Content   NVARCHAR(MAX)    NULL, -- 筆記內容
    CreatedAt DATETIME2(7)     NOT NULL CONSTRAINT DF_Notes_CreatedAt DEFAULT SYSUTCDATETIME(), -- 建立時間（UTC）
    UpdatedAt DATETIME2(7)     NULL, -- 最後修改時間（UTC）
    CONSTRAINT PK_Notes PRIMARY KEY (Id),
    CONSTRAINT FK_Notes_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Notes_Users FOREIGN KEY (AuthorId) REFERENCES dbo.Users(User_Id)
);

CREATE TABLE dbo.Posts (
    Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Posts_Id DEFAULT NEWSEQUENTIALID(), -- 文章識別碼
    CourseId  UNIQUEIDENTIFIER NOT NULL, -- 所屬課程
    AuthorId  UNIQUEIDENTIFIER NOT NULL, -- 文章作者
    Title     NVARCHAR(200)    NOT NULL, -- 文章標題
    Content   NVARCHAR(MAX)    NULL, -- 文章內容
    CreatedAt DATETIME2(7)     NOT NULL CONSTRAINT DF_Posts_CreatedAt DEFAULT SYSUTCDATETIME(), -- 發布時間（UTC）
    CONSTRAINT PK_Posts PRIMARY KEY (Id),
    CONSTRAINT FK_Posts_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Posts_Users FOREIGN KEY (AuthorId) REFERENCES dbo.Users(User_Id)
);
CREATE TABLE dbo.Comments (
    Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Comments_Id DEFAULT NEWSEQUENTIALID(), -- 留言識別碼
    PostId    UNIQUEIDENTIFIER NOT NULL, -- 所屬文章
    AuthorId  UNIQUEIDENTIFIER NOT NULL, -- 留言作者
    Content   NVARCHAR(2000)   NOT NULL, -- 留言內容
    CreatedAt DATETIME2(7)     NOT NULL CONSTRAINT DF_Comments_CreatedAt DEFAULT SYSUTCDATETIME(), -- 留言時間（UTC）
    CONSTRAINT PK_Comments PRIMARY KEY (Id),
    CONSTRAINT FK_Comments_Posts FOREIGN KEY (PostId) REFERENCES dbo.Posts(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (AuthorId) REFERENCES dbo.Users(User_Id)
);

CREATE TABLE dbo.Tasks (
    Id          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Tasks_Id DEFAULT NEWSEQUENTIALID(), -- 任務識別碼
    CourseId    UNIQUEIDENTIFIER NOT NULL, -- 所屬課程
    AssigneeId  UNIQUEIDENTIFIER NULL, -- 被指派使用者，NULL 表示未指派
    Title       NVARCHAR(200)    NOT NULL, -- 任務標題
    Description NVARCHAR(2000)   NULL, -- 任務說明
    Status      INT              NOT NULL CONSTRAINT DF_Tasks_Status DEFAULT (0), -- 任務狀態
    DueDate     DATETIME2(7)     NULL, -- 任務截止日期時間
    CreatedAt   DATETIME2(7)     NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSUTCDATETIME(), -- 建立時間（UTC）
    CONSTRAINT PK_Tasks PRIMARY KEY (Id),
    CONSTRAINT FK_Tasks_Courses FOREIGN KEY (CourseId) REFERENCES dbo.Courses(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Tasks_Users FOREIGN KEY (AssigneeId) REFERENCES dbo.Users(User_Id) ON DELETE SET NULL,
    CONSTRAINT CK_Task_Status CHECK (Status IN (0, 1, 2))
);

CREATE TABLE dbo.RefreshTokens (
    Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RefreshTokens_Id DEFAULT NEWSEQUENTIALID(), -- 權杖紀錄識別碼
    Token     NVARCHAR(500)    NOT NULL, -- 登入續期憑證，用來取得新的 Access Token
    UserId    UNIQUEIDENTIFIER NOT NULL, -- 所屬使用者，對應 Users.User_Id
    ExpiresAt DATETIME2(7)     NOT NULL, -- 到期時間（UTC）
    CreatedAt DATETIME2(7)     NOT NULL CONSTRAINT DF_RefreshTokens_CreatedAt DEFAULT SYSUTCDATETIME(), -- 建立時間（UTC）
    IsRevoked BIT              NOT NULL CONSTRAINT DF_RefreshTokens_IsRevoked DEFAULT (0), -- 是否已撤銷：0=否、1=是
    CONSTRAINT PK_RefreshTokens PRIMARY KEY (Id),
    CONSTRAINT FK_RefreshTokens_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(User_Id) ON DELETE CASCADE
);
GO

CREATE INDEX IX_CourseMembers_UserId ON dbo.CourseMembers(UserId);
CREATE INDEX IX_Notes_CourseId ON dbo.Notes(CourseId);
CREATE INDEX IX_Notes_AuthorId ON dbo.Notes(AuthorId);
CREATE INDEX IX_Posts_CourseId ON dbo.Posts(CourseId);
CREATE INDEX IX_Posts_AuthorId ON dbo.Posts(AuthorId);
CREATE INDEX IX_Comments_PostId ON dbo.Comments(PostId);
CREATE INDEX IX_Comments_AuthorId ON dbo.Comments(AuthorId);
CREATE INDEX IX_Tasks_CourseId ON dbo.Tasks(CourseId);
CREATE INDEX IX_Tasks_AssigneeId ON dbo.Tasks(AssigneeId);
CREATE UNIQUE INDEX IX_RefreshTokens_Token ON dbo.RefreshTokens(Token);
CREATE INDEX IX_RefreshTokens_UserId ON dbo.RefreshTokens(UserId);
CREATE INDEX IX_RefreshTokens_ExpiresAt ON dbo.RefreshTokens(ExpiresAt);
GO

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'Refresh Token 紀錄的唯一識別碼（主鍵）',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'Id';

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'儲存使用者的登入續期憑證，用於取得新的存取權杖，避免重新登入',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'Token';

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'權杖所屬使用者，外鍵對應 dbo.Users.User_Id',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'UserId';

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'權杖到期時間（UTC），超過此時間不可換發',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'ExpiresAt';

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'權杖建立時間（UTC）',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'CreatedAt';

EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'權杖是否已撤銷：0＝未撤銷（仍須檢查是否過期）；1＝已撤銷，不可使用',
    @level0type=N'SCHEMA', @level0name=N'dbo',
    @level1type=N'TABLE', @level1name=N'RefreshTokens',
    @level2type=N'COLUMN', @level2name=N'IsRevoked';
GO

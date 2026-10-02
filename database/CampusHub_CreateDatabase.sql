-- CampusHub SQL Server database schema
-- 依 CampusHub-Requirements.md MVP 設計

IF DB_ID('CampusHub') IS NULL
BEGIN
    CREATE DATABASE CampusHub;
END
GO

USE CampusHub;
GO

-- 使用者
CREATE TABLE dbo.Users (
    User_Id      UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Users_UserId DEFAULT NEWSEQUENTIALID(),
    Name         NVARCHAR(100)    NOT NULL,
    Email        NVARCHAR(256)    NOT NULL,
    PasswordHash NVARCHAR(512)    NOT NULL,
    CreatedAt    DATETIME2(0)     NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Users PRIMARY KEY (User_Id),
    CONSTRAINT UQ_Users_Email UNIQUE (Email)
);

-- 課程
CREATE TABLE dbo.Courses (
    Course_Id   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Courses_CourseId DEFAULT NEWSEQUENTIALID(),
    Name        NVARCHAR(200)    NOT NULL,
    Code        NVARCHAR(50)     NOT NULL,
    Description NVARCHAR(1000)   NULL,
    CONSTRAINT PK_Courses PRIMARY KEY (Course_Id),
    CONSTRAINT UQ_Courses_Code UNIQUE (Code)
);

-- 課程成員
CREATE TABLE dbo.CourseMembers (
    Course_Id UNIQUEIDENTIFIER NOT NULL,
    User_Id   UNIQUEIDENTIFIER NOT NULL,
    Role      NVARCHAR(20)     NOT NULL,
    JoinedAt  DATETIME2(0)     NOT NULL CONSTRAINT DF_CourseMembers_JoinedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_CourseMembers PRIMARY KEY (Course_Id, User_Id),
    CONSTRAINT FK_CourseMembers_Courses FOREIGN KEY (Course_Id) REFERENCES dbo.Courses(Course_Id) ON DELETE CASCADE,
    CONSTRAINT FK_CourseMembers_Users   FOREIGN KEY (User_Id)   REFERENCES dbo.Users(User_Id)   ON DELETE CASCADE,
    CONSTRAINT CK_CourseMembers_Role CHECK (Role IN ('Owner', 'TA', 'Member'))
);

-- 筆記
CREATE TABLE dbo.Notes (
    Note_Id   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Notes_NoteId DEFAULT NEWSEQUENTIALID(),
    Course_Id UNIQUEIDENTIFIER NOT NULL,
    Author_Id UNIQUEIDENTIFIER NOT NULL,
    Title     NVARCHAR(200)    NOT NULL,
    Content   NVARCHAR(MAX)    NULL,
    CreatedAt DATETIME2(0)     NOT NULL CONSTRAINT DF_Notes_CreatedAt DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2(0)     NULL,
    CONSTRAINT PK_Notes PRIMARY KEY (Note_Id),
    CONSTRAINT FK_Notes_Courses FOREIGN KEY (Course_Id) REFERENCES dbo.Courses(Course_Id) ON DELETE CASCADE,
    CONSTRAINT FK_Notes_Users   FOREIGN KEY (Author_Id) REFERENCES dbo.Users(User_Id)
);

-- 討論區文章
CREATE TABLE dbo.Posts (
    Post_Id   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Posts_PostId DEFAULT NEWSEQUENTIALID(),
    Course_Id UNIQUEIDENTIFIER NOT NULL,
    Author_Id UNIQUEIDENTIFIER NOT NULL,
    Title     NVARCHAR(200)    NOT NULL,
    Content   NVARCHAR(MAX)    NULL,
    CreatedAt DATETIME2(0)     NOT NULL CONSTRAINT DF_Posts_CreatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Posts PRIMARY KEY (Post_Id),
    CONSTRAINT FK_Posts_Courses FOREIGN KEY (Course_Id) REFERENCES dbo.Courses(Course_Id) ON DELETE CASCADE,
    CONSTRAINT FK_Posts_Users   FOREIGN KEY (Author_Id) REFERENCES dbo.Users(User_Id)
);

-- 留言
CREATE TABLE dbo.Comments (
    Comment_Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Comments_CommentId DEFAULT NEWSEQUENTIALID(),
    Post_Id    UNIQUEIDENTIFIER NOT NULL,
    Author_Id  UNIQUEIDENTIFIER NOT NULL,
    Content    NVARCHAR(2000)   NOT NULL,
    CreatedAt  DATETIME2(0)     NOT NULL CONSTRAINT DF_Comments_CreatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Comments PRIMARY KEY (Comment_Id),
    CONSTRAINT FK_Comments_Posts FOREIGN KEY (Post_Id)   REFERENCES dbo.Posts(Post_Id) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (Author_Id) REFERENCES dbo.Users(User_Id)
);

-- 任務
CREATE TABLE dbo.Tasks (
    Task_Id     UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Tasks_TaskId DEFAULT NEWSEQUENTIALID(),
    Course_Id   UNIQUEIDENTIFIER NOT NULL,
    Assignee_Id UNIQUEIDENTIFIER NULL,
    Title       NVARCHAR(200)    NOT NULL,
    Description NVARCHAR(2000)   NULL,
    Status      NVARCHAR(20)     NOT NULL CONSTRAINT DF_Tasks_Status DEFAULT 'Todo',
    DueDate     DATE             NULL,
    CreatedAt   DATETIME2(0)     NOT NULL CONSTRAINT DF_Tasks_CreatedAt DEFAULT SYSDATETIME(),
    CONSTRAINT PK_Tasks PRIMARY KEY (Task_Id),
    CONSTRAINT FK_Tasks_Courses FOREIGN KEY (Course_Id)   REFERENCES dbo.Courses(Course_Id) ON DELETE CASCADE,
    CONSTRAINT FK_Tasks_Users   FOREIGN KEY (Assignee_Id) REFERENCES dbo.Users(User_Id),
    CONSTRAINT CK_Tasks_Status CHECK (Status IN ('Todo', 'Doing', 'Done'))
);

-- 常用查詢索引
CREATE INDEX IX_CourseMembers_UserId ON dbo.CourseMembers(User_Id);
CREATE INDEX IX_Notes_CourseId       ON dbo.Notes(Course_Id);
CREATE INDEX IX_Notes_AuthorId       ON dbo.Notes(Author_Id);
CREATE INDEX IX_Posts_CourseId       ON dbo.Posts(Course_Id);
CREATE INDEX IX_Posts_AuthorId       ON dbo.Posts(Author_Id);
CREATE INDEX IX_Comments_PostId      ON dbo.Comments(Post_Id);
CREATE INDEX IX_Tasks_CourseId       ON dbo.Tasks(Course_Id);
CREATE INDEX IX_Tasks_AssigneeId     ON dbo.Tasks(Assignee_Id);
GO

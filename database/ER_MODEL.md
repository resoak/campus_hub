# CampusHub ER Model

實際 schema 由 EF Core Code First (EnsureCreated) 管理；CampusHub_CreateDatabase.sql 僅供參考。
EF 實際表：AspNetUsers, Courses, CourseMembers, Notes, Posts, Comments, Tasks, RefreshTokens（+ AspNet* Identity 表）。

```mermaid
erDiagram
    User ||--o{ CourseMember : "joins"
    Course ||--o{ CourseMember : "has"
    Course ||--o{ Note : "has"
    Course ||--o{ Post : "has"
    Course ||--o{ TaskItem : "has"
    User ||--o{ Note : "authors"
    User ||--o{ Post : "authors"
    User ||--o{ TaskItem : "assigned"
    Post ||--o{ Comment : "has"
    User ||--o{ Comment : "authors"
    User ||--o{ RefreshToken : "owns"

    User {
        guid Id PK
        string Name
        string Email
        datetime CreatedAt
    }
    Course {
        guid Id PK
        string Name
        string Code UK
        string Description
    }
    CourseMember {
        guid CourseId PK,FK
        guid UserId PK,FK
        enum Role "Owner/TA/Member"
        datetime JoinedAt
    }
    Note {
        guid Id PK
        guid CourseId FK
        guid AuthorId FK
        string Title
        string Content
        datetime CreatedAt
        datetime UpdatedAt
    }
    Post {
        guid Id PK
        guid CourseId FK
        guid AuthorId FK
        string Title
        string Content
        datetime CreatedAt
    }
    Comment {
        guid Id PK
        guid PostId FK
        guid AuthorId FK
        string Content
        datetime CreatedAt
    }
    TaskItem {
        guid Id PK
        guid CourseId FK
        guid AssigneeId FK "nullable"
        string Title
        string Description
        enum Status "Todo/Doing/Done"
        date DueDate
        datetime CreatedAt
    }
    RefreshToken {
        guid Id PK
        guid UserId FK
        string Token
        datetime ExpiresAt
    }
```

關聯重點：
- CourseMember 多對多，複合 PK (CourseId, UserId)，Role 區分 Owner/TA/Member
- Note/Post/TaskItem 都屬於 Course（刪課程級聯刪除）
- TaskItem.AssigneeId 可為 null；Comment 只掛 Post

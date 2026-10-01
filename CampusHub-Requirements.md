# CampusHub 功能需求文件

## 專案簡介

CampusHub 是一個提供大學生進行課程學習、知識整理、討論交流與團隊協作的平台。

目標是整合：

- 課程管理
- 筆記分享
- 課程討論
- 任務協作
- 學習資源整合

讓學生能在單一平台中完成學習相關活動。

---

# MVP（Minimum Viable Product）

## 1. 使用者系統

### 功能需求

- 使用者註冊
- 使用者登入
- 查看個人資料
- 修改個人資料
- JWT Authentication
- Email 不可重複

### Entity

```text
User
├─ User_Id (PK)
├─ Name
├─ Email (UNIQUE)
├─ PasswordHash
└─ CreatedAt
```

---

## 2. 課程管理

### 功能需求

- 建立課程
- 加入課程
- 查看課程資訊
- 修改課程資訊
- 管理課程成員

### Entity

```text
Course
├─ Course_Id (PK)
├─ Name
├─ Code (UNIQUE)
└─ Description
```

---

## 3. 課程成員管理

### 功能需求

- 新增成員
- 移除成員
- 查詢課程成員

### 角色

- Owner
- TA
- Member

### Entity

```text
CourseMember
├─ Course_Id (FK)
├─ User_Id (FK)
├─ Role
└─ JoinedAt
```

---

## 4. 筆記系統

### 功能需求

- 建立筆記
- 編輯筆記
- 刪除筆記
- 瀏覽筆記
- 查詢課程筆記

### Entity

```text
Note
├─ Note_Id (PK)
├─ Course_Id (FK)
├─ Author_Id (FK)
├─ Title
├─ Content
├─ CreatedAt
└─ UpdatedAt
```

---

## 5. 討論區

### 功能需求

- 發布文章
- 編輯文章
- 刪除文章
- 查閱文章

### Entity

```text
Post
├─ Post_Id (PK)
├─ Course_Id (FK)
├─ Author_Id (FK)
├─ Title
├─ Content
└─ CreatedAt
```

---

## 6. 留言系統

### 功能需求

- 發表留言
- 刪除留言
- 查看留言

### Entity

```text
Comment
├─ Comment_Id (PK)
├─ Post_Id (FK)
├─ Author_Id (FK)
├─ Content
└─ CreatedAt
```

---

## 7. 任務管理看板

類似簡化版 Trello。

### 功能需求

- 建立任務
- 編輯任務
- 指派成員
- 修改任務狀態
- 設定截止日期
- 查看任務列表

### 狀態

```text
Todo
Doing
Done
```

### Entity

```text
Task
├─ Task_Id (PK)
├─ Course_Id (FK)
├─ Assignee_Id (FK)
├─ Title
├─ Description
├─
-- CampusHub：為既有 dbo.RefreshTokens 六個欄位新增 SQL Server 描述
-- 前提：dbo.RefreshTokens 已存在，且尚未設定這六個欄位的 MS_Description。
-- 此腳本僅新增欄位描述，不會修改欄位、索引或資料。
USE CampusHub;
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

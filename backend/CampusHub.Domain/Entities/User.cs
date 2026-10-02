using Microsoft.AspNetCore.Identity;

namespace CampusHub.Domain.Entities;

// 使用者 — JWT 登入；Identity 已內建 Email/PasswordHash/CreatedAt 以外欄位
public class User : IdentityUser<Guid>
{
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public virtual ICollection<CourseMember> CourseMemberships { get; set; } = new List<CourseMember>();
}

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Token { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRevoked { get; set; } = false;
}

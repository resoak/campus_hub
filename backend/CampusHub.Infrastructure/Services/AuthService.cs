using CampusHub.Domain.Entities;
using CampusHub.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Infrastructure.Services;

// 使用 Email 登入；保留 Identity 密碼雜湊演算法，不依賴 Identity 資料表。
public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string email, string password, string name);
    Task<AuthResult> LoginAsync(string email, string password);
    Task<AuthResult> RefreshTokenAsync(string refreshToken);
    Task<bool> RevokeRefreshTokenAsync(string refreshToken);
    Task<User?> GetUserByIdAsync(Guid userId);
}

public class AuthResult
{
    public bool Succeeded { get; set; }
    public string? AccessToken { get; set; }
    public string? RefreshToken { get; set; }
    public User? User { get; set; }
    public string[] Errors { get; set; } = [];
}

public class AuthService : IAuthService
{
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly CampusHubDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(IPasswordHasher<User> passwordHasher, CampusHubDbContext context, ITokenService tokenService)
    {
        _passwordHasher = passwordHasher;
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> RegisterAsync(string email, string password, string name)
    {
        email = email.Trim();
        name = name.Trim();

        if (await _context.Users.AnyAsync(u => u.Email == email))
            return new AuthResult { Errors = ["此電子郵件已被註冊"] };

        // 維持原先密碼政策：8 字以上，需有大小寫英文字母與數字。
        if (password.Length < 8 || !password.Any(char.IsUpper) ||
            !password.Any(char.IsLower) || !password.Any(char.IsDigit))
            return new AuthResult { Errors = ["密碼至少 8 字元，且須包含大寫、小寫英文字母及數字"] };

        var user = new User { Email = email, Name = name };
        user.PasswordHash = _passwordHasher.HashPassword(user, password);

        _context.Users.Add(user);
        var result = CreateTokens(user);
        await _context.SaveChangesAsync();
        return result;
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        email = email.Trim();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user is null)
            return new AuthResult { Errors = ["電子郵件或密碼錯誤"] };

        var verification = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verification == PasswordVerificationResult.Failed)
            return new AuthResult { Errors = ["電子郵件或密碼錯誤"] };

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
            user.PasswordHash = _passwordHasher.HashPassword(user, password);

        var result = CreateTokens(user);
        await _context.SaveChangesAsync();
        return result;
    }

    private AuthResult CreateTokens(User user)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();
        _context.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            User = user,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        });
        return new AuthResult
        {
            Succeeded = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = user,
        };
    }

    public async Task<AuthResult> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow);

        if (storedToken is null)
            return new AuthResult { Errors = ["無效或已過期的重新整理權杖"] };

        storedToken.IsRevoked = true;
        var result = CreateTokens(storedToken.User);
        await _context.SaveChangesAsync();
        return result;
    }

    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);
        if (storedToken is null)
            return false;

        storedToken.IsRevoked = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public Task<User?> GetUserByIdAsync(Guid userId) =>
        _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
}

using CampusHub.Domain.Entities;
using CampusHub.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Infrastructure.Services;

public interface IAuthService
{
    Task<AuthResult> RegisterAsync(string username, string email, string password);
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
    private readonly UserManager<User> _userManager;
    private readonly CampusHubDbContext _context;
    private readonly ITokenService _tokenService;

    public AuthService(
        UserManager<User> userManager,
        CampusHubDbContext context,
        ITokenService tokenService)
    {
        _userManager = userManager;
        _context = context;
        _tokenService = tokenService;
    }

    public async Task<AuthResult> RegisterAsync(string username, string email, string password)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser != null)
        {
            return new AuthResult { Succeeded = false, Errors = new[] { "此電子郵件已被註冊" } };
        }

        existingUser = await _userManager.FindByNameAsync(username);
        if (existingUser != null)
        {
            return new AuthResult { Succeeded = false, Errors = new[] { "此用戶名已被使用" } };
        }

        var user = new User
        {
            UserName = username,
            Email = email,
        };

        var result = await _userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            return new AuthResult { Succeeded = false, Errors = result.Errors.Select(e => e.Description).ToArray() };
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResult
        {
            Succeeded = true,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            User = user,
        };
    }

    public async Task<AuthResult> LoginAsync(string email, string password)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            return new AuthResult { Succeeded = false, Errors = new[] { "電子郵件或密碼錯誤" } };
        }

        var isValid = await _userManager.CheckPasswordAsync(user, password);
        if (!isValid)
        {
            return new AuthResult { Succeeded = false, Errors = new[] { "電子郵件或密碼錯誤" } };
        }

        var accessToken = _tokenService.GenerateAccessToken(user);
        var refreshToken = _tokenService.GenerateRefreshToken();

        var refreshTokenEntity = new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        _context.RefreshTokens.Add(refreshTokenEntity);
        await _context.SaveChangesAsync();

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

        if (storedToken == null)
        {
            return new AuthResult { Succeeded = false, Errors = new[] { "無效或已過期的重新整理權杖" } };
        }

        // Revoke old refresh token
        storedToken.IsRevoked = true;

        // Generate new tokens
        var newAccessToken = _tokenService.GenerateAccessToken(storedToken.User);
        var newRefreshToken = _tokenService.GenerateRefreshToken();

        var newRefreshTokenEntity = new RefreshToken
        {
            Token = newRefreshToken,
            UserId = storedToken.UserId,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
        };

        _context.RefreshTokens.Add(newRefreshTokenEntity);
        await _context.SaveChangesAsync();

        return new AuthResult
        {
            Succeeded = true,
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            User = storedToken.User,
        };
    }

    public async Task<bool> RevokeRefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked);

        if (storedToken == null)
        {
            return false;
        }

        storedToken.IsRevoked = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<User?> GetUserByIdAsync(Guid userId)
    {
        return await _userManager.FindByIdAsync(userId.ToString());
    }
}
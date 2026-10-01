using CampusHub.Application.DTOs;
using CampusHub.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

// 認證 API — 處理登入、註冊、token 刷新、登出
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request.Username, request.Email, request.Password);
        
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponse
            {
                Succeeded = false,
                Errors = result.Errors,
            });
        }

        // Set refresh token in httpOnly cookie
        SetRefreshTokenCookie(result.RefreshToken!);

        return Ok(new AuthResponse
        {
            Succeeded = true,
            AccessToken = result.AccessToken,
            RefreshToken = result.RefreshToken,
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                AvatarUrl = result.User.AvatarUrl,
                Role = result.User.Role.ToString(),
                CreatedAt = result.User.CreatedAt,
            } : null,
        });
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request.Email, request.Password);
        
        if (!result.Succeeded)
        {
            return BadRequest(new AuthResponse
            {
                Succeeded = false,
                Errors = result.Errors,
            });
        }

        // Set refresh token in httpOnly cookie
        SetRefreshTokenCookie(result.RefreshToken!);

        return Ok(new AuthResponse
        {
            Succeeded = true,
            AccessToken = result.AccessToken,
            RefreshToken = result.RefreshToken,
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                AvatarUrl = result.User.AvatarUrl,
                Role = result.User.Role.ToString(),
                CreatedAt = result.User.CreatedAt,
            } : null,
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        // Try to get from body first, then from cookie
        var refreshToken = request.RefreshToken ?? Request.Cookies["refresh_token"];
        
        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest(new AuthResponse
            {
                Succeeded = false,
                Errors = new[] { "缺少重新整理權杖" },
            });
        }

        var result = await _authService.RefreshTokenAsync(refreshToken);
        
        if (!result.Succeeded)
        {
            ClearRefreshTokenCookie();
            return BadRequest(new AuthResponse
            {
                Succeeded = false,
                Errors = result.Errors,
            });
        }

        // Set new refresh token in httpOnly cookie
        SetRefreshTokenCookie(result.RefreshToken!);

        return Ok(new AuthResponse
        {
            Succeeded = true,
            AccessToken = result.AccessToken,
            RefreshToken = result.RefreshToken,
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                AvatarUrl = result.User.AvatarUrl,
                Role = result.User.Role.ToString(),
                CreatedAt = result.User.CreatedAt,
            } : null,
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request = null)
    {
        var refreshToken = request?.RefreshToken ?? Request.Cookies["refresh_token"];
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.RevokeRefreshTokenAsync(refreshToken);
        }

        ClearRefreshTokenCookie();
        return Ok(new { message = "登出成功" });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserDto
        {
            Id = user.Id,
            Username = user.UserName!,
            Email = user.Email!,
            AvatarUrl = user.AvatarUrl,
            Role = user.Role.ToString(),
            CreatedAt = user.CreatedAt,
        });
    }

    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(7),
            Path = "/",
        };
        Response.Cookies.Append("refresh_token", refreshToken, cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddDays(-1),
            Path = "/",
        };
        Response.Cookies.Append("refresh_token", "", cookieOptions);
    }
}
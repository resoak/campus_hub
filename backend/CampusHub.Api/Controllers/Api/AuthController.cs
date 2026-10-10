using CampusHub.Application.DTOs;
using CampusHub.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

// 認�? API ???��??�入?�註?�、token ?�新?�登??
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
        var result = await _authService.RegisterAsync(request.Username, request.Email, request.Password, request.Name);
        
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
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                Name = result.User.Name,
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
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                Name = result.User.Name,
                CreatedAt = result.User.CreatedAt,
            } : null,
        });
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> RefreshToken([FromBody] RefreshTokenRequest? request = null)
    {
        // Try to get from body first, then from cookie
        var bodyRefreshToken = request?.RefreshToken;
        var refreshToken = string.IsNullOrWhiteSpace(bodyRefreshToken)
            ? Request.Cookies["refresh_token"]
            : bodyRefreshToken;
        
        if (string.IsNullOrEmpty(refreshToken))
        {
            return BadRequest(new AuthResponse
            {
                Succeeded = false,
                Errors = new[] { "缺�??�新?��?權�?" },
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
            User = result.User != null ? new UserDto
            {
                Id = result.User.Id,
                Username = result.User.UserName!,
                Email = result.User.Email!,
                Name = result.User.Name,
                CreatedAt = result.User.CreatedAt,
            } : null,
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest? request = null)
    {
        var refreshToken = string.IsNullOrWhiteSpace(request?.RefreshToken)
            ? Request.Cookies["refresh_token"]
            : request.RefreshToken;
        
        if (!string.IsNullOrEmpty(refreshToken))
        {
            await _authService.RevokeRefreshTokenAsync(refreshToken);
        }

        ClearRefreshTokenCookie();
        return Ok(new { message = "?�出?��?" });
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
            Name = user.Name,
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
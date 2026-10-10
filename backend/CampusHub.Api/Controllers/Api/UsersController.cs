using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using CampusHub.Application.DTOs;
using CampusHub.Domain.Entities;
using CampusHub.Infrastructure.Services;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly UserManager<User> _userManager;

    public UsersController(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    /// <summary>
    /// 取得當前使用者資料
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var uid))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(uid.ToString());
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

    /// <summary>
    /// 修改當前使用者資料 (僅支援修改 Name)
    /// </summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> PutMe([FromBody] UpdateUserNameRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var uid))
        {
            return Unauthorized();
        }

        var user = await _userManager.FindByIdAsync(uid.ToString());
        if (user == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { errors = new[] { "姓名不可空白" } });
        }

        user.Name = request.Name.Trim();
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return BadRequest(new { errors = updateResult.Errors.Select(error => error.Description) });
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
}

/// <summary>
/// 更新使用者名稱的請求模型
/// </summary>
public class UpdateUserNameRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? Name { get; set; }
}
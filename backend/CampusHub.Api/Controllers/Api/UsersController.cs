using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CampusHub.Application.DTOs;
using CampusHub.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly CampusHubDbContext _context;

    public UsersController(CampusHubDbContext context) => _context = context;

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetMe()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var uid)) return Unauthorized();
        var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == uid);
        if (user is null) return NotFound();
        return ToDto(user);
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> PutMe([FromBody] UpdateUserNameRequest request)
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userId, out var uid)) return Unauthorized();
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == uid);
        if (user is null) return NotFound();
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { errors = new[] { "姓名不可空白" } });

        user.Name = request.Name.Trim();
        await _context.SaveChangesAsync();
        return ToDto(user);
    }

    private static UserDto ToDto(CampusHub.Domain.Entities.User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Name = user.Name,
        CreatedAt = user.CreatedAt
    };
}

public class UpdateUserNameRequest
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.StringLength(100)]
    public string? Name { get; set; }
}

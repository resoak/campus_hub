using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<CommentDto>> UpdateComment(Guid id, [FromBody] UpdateCommentRequest request)
    {
        var userId = GetCurrentUserId()!.Value;
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Moderator");

        try
        {
            var comment = await _commentService.UpdateCommentAsync(id, userId, request);
            return Ok(comment);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Moderator");

        try
        {
            var result = await _commentService.DeleteCommentAsync(id, userId, isAdmin);
            if (!result)
                return NotFound(new { message = "留言不存在" });
            
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult<LikeResponse>> LikeComment(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _commentService.LikeCommentAsync(id, userId);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult<LikeResponse>> UnlikeComment(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _commentService.UnlikeCommentAsync(id, userId);
        return Ok(result);
    }

    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }
}
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class PostsController : ControllerBase
{
    private readonly IPostService _postService;
    private readonly ICommentService _commentService;

    public PostsController(IPostService postService, ICommentService commentService)
    {
        _postService = postService;
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<ActionResult<PaginatedResponse<PostDto>>> GetPosts([FromQuery] PostFilters filters)
    {
        var result = await _postService.GetPostsAsync(filters);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PostDto>> GetPost(Guid id)
    {
        var currentUserId = GetCurrentUserId();
        var post = await _postService.GetPostByIdAsync(id, currentUserId);

        if (post == null)
        {
            return NotFound(new { message = "文章不存在" });
        }

        // Increment view count (fire and forget)
        _ = _postService.IncrementViewCountAsync(id);

        return Ok(post);
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<PostDto>> CreatePost([FromBody] CreatePostRequest request)
    {
        var userId = GetCurrentUserId()!.Value;
        var post = await _postService.CreatePostAsync(userId, request);
        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<ActionResult<PostDto>> UpdatePost(Guid id, [FromBody] UpdatePostRequest request)
    {
        var userId = GetCurrentUserId()!.Value;
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Moderator");

        try
        {
            var post = await _postService.UpdatePostAsync(id, userId, request);
            return Ok(post);
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
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var isAdmin = User.IsInRole("Admin") || User.IsInRole("Moderator");

        try
        {
            var result = await _postService.DeletePostAsync(id, userId, isAdmin);
            if (!result)
                return NotFound(new { message = "文章不存在" });
            
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult<LikeResponse>> LikePost(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _postService.LikePostAsync(id, userId);
        return Ok(result);
    }

    [HttpDelete("{id:guid}/like")]
    [Authorize]
    public async Task<ActionResult<LikeResponse>> UnlikePost(Guid id)
    {
        var userId = GetCurrentUserId()!.Value;
        var result = await _postService.UnlikePostAsync(id, userId);
        return Ok(result);
    }

    [HttpGet("{id:guid}/comments")]
    public async Task<ActionResult<CommentDto[]>> GetComments(Guid id)
    {
        var comments = await _commentService.GetCommentsByPostAsync(id);
        return Ok(comments);
    }

    [HttpPost("{id:guid}/comments")]
    [Authorize]
    public async Task<ActionResult<CommentDto>> CreateComment(Guid id, [FromBody] CreateCommentRequest request)
    {
        var userId = GetCurrentUserId()!.Value;
        request.PostId = id;
        
        try
        {
            var comment = await _commentService.CreateCommentAsync(userId, request);
            return CreatedAtAction(nameof(GetComments), new { id }, comment);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
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
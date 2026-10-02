using System.Security.Claims;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _service;

    public CommentsController(ICommentService service) => _service = service;

    [HttpGet("post/{postId:guid}")]
    public async Task<ActionResult<CommentDto[]>> GetByPost(Guid postId)
        => Ok(await _service.GetByPostAsync(postId));

    [HttpPost]
    public async Task<ActionResult<CommentDto>> Create([FromBody] CreateCommentRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try { return Ok(await _service.CreateAsync(userId.Value, request)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.DeleteAsync(id, userId.Value)) ? Ok() : NotFound();
    }

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}

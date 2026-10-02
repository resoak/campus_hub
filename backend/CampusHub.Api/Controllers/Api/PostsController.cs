using System.Security.Claims;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly IPostService _service;

    public PostsController(IPostService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<PostDto>> Create([FromBody] CreatePostRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try { return Ok(await _service.CreateAsync(userId.Value, request)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PostDto>> GetById(Guid id)
        => (await _service.GetByIdAsync(id)) is { } p ? Ok(p) : NotFound();

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<PostDto[]>> GetByCourse(Guid courseId)
        => Ok(await _service.GetByCourseAsync(courseId));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PostDto>> Update(Guid id, [FromBody] UpdatePostRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.UpdateAsync(id, userId.Value, request)) is { } p ? Ok(p) : NotFound();
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

using System.Security.Claims;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotesController : ControllerBase
{
    private readonly INoteService _service;

    public NotesController(INoteService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<NoteDto>> Create([FromBody] CreateNoteRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try { return Ok(await _service.CreateAsync(userId.Value, request)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<NoteDto>> GetById(Guid id)
        => (await _service.GetByIdAsync(id)) is { } n ? Ok(n) : NotFound();

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<NoteDto[]>> GetByCourse(Guid courseId)
        => Ok(await _service.GetByCourseAsync(courseId));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<NoteDto>> Update(Guid id, [FromBody] UpdateNoteRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.UpdateAsync(id, userId.Value, request)) is { } n ? Ok(n) : NotFound();
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

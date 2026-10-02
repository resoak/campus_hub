using System.Security.Claims;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _service;

    public TasksController(ITaskService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<TaskDto>> Create([FromBody] CreateTaskRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        try { return Ok(await _service.CreateAsync(userId.Value, request)); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TaskDto>> GetById(Guid id)
        => (await _service.GetByIdAsync(id)) is { } t ? Ok(t) : NotFound();

    [HttpGet("course/{courseId:guid}")]
    public async Task<ActionResult<TaskDto[]>> GetByCourse(Guid courseId)
        => Ok(await _service.GetByCourseAsync(courseId));

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<TaskDto>> Update(Guid id, [FromBody] UpdateTaskRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.UpdateAsync(id, userId.Value, request)) is { } t ? Ok(t) : NotFound();
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

using System.Security.Claims;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _service;

    public CoursesController(ICourseService service) => _service = service;

    [HttpPost]
    public async Task<ActionResult<CourseDto>> Create([FromBody] CreateCourseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return Ok(await _service.CreateAsync(userId.Value, request));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseDto>> GetById(Guid id)
        => (await _service.GetByIdAsync(id)) is { } c ? Ok(c) : NotFound();

    [HttpGet("mine")]
    public async Task<ActionResult<CourseDto[]>> GetMine()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return Ok(await _service.GetByUserAsync(userId.Value));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseDto>> Update(Guid id, [FromBody] UpdateCourseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.UpdateAsync(id, userId.Value, request)) is { } c ? Ok(c) : NotFound();
    }

    [HttpPost("{id:guid}/members")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return (await _service.AddMemberAsync(id, userId.Value, request)) ? Ok() : BadRequest();
    }

    [HttpDelete("{id:guid}/members/{userId:guid}")]
    public async Task<IActionResult> RemoveMember(Guid id, Guid userId)
    {
        var operatorId = GetUserId();
        if (operatorId == null) return Unauthorized();
        return (await _service.RemoveMemberAsync(id, operatorId.Value, userId)) ? Ok() : BadRequest();
    }

    [HttpGet("{id:guid}/members")]
    public async Task<ActionResult<CourseMemberDto[]>> GetMembers(Guid id)
        => Ok(await _service.GetMembersAsync(id));

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var id) ? id : null;
    }
}

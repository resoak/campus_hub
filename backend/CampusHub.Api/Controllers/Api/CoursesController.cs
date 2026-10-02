using System.Security.Claims;
using CampusHub.Application.Common;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController] // 自動驗證 Request DTO，無效輸入回傳 400。
[Route("api/[controller]")]
[Authorize] // 需登入；各課程的成員與角色權限由 Service 檢查。
public class CoursesController : ControllerBase
{
    private readonly ICourseService _service;

    public CoursesController(ICourseService service) => _service = service; // DI 注入課程服務，Controller 負責 HTTP 接口。

    [HttpPost] // 建立課程，登入者自動成為 Owner。
    public async Task<ActionResult<CourseDto>> Create([FromBody] CreateCourseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.CreateAsync(userId.Value, request));
    }

    [HttpGet("{id:guid}")] // 查看指定課程，限該課程成員。
    public async Task<ActionResult<CourseDto>> GetById(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.GetByIdAsync(id, userId.Value));
    }

    [HttpGet("mine")] // 列出登入者建立或加入的課程。
    public async Task<ActionResult<CourseDto[]>> GetMine()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return Ok(await _service.GetByUserAsync(userId.Value));
    }

    [HttpPut("{id:guid}")] // 修改課程名稱與說明，限 Owner。
    public async Task<ActionResult<CourseDto>> Update(Guid id, [FromBody] UpdateCourseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.UpdateAsync(id, userId.Value, request));
    }

    [HttpPost("join")] // 輸入課程代碼直接加入，預設角色為 Member。
    public async Task<IActionResult> Join([FromBody] JoinCourseRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.JoinAsync(userId.Value, request));
    }

    [HttpPost("{id:guid}/members")] // Owner 可新增 TA/Member；TA 只能新增 Member。
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.AddMemberAsync(id, userId.Value, request));
    }

    [HttpPatch("{id:guid}/members/{memberId:guid}/role")] // Owner 調整目標成員角色，不轉移擁有權。
    public async Task<IActionResult> UpdateMemberRole(Guid id, Guid memberId, [FromBody] UpdateMemberRoleRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.UpdateMemberRoleAsync(id, userId.Value, memberId, request));
    }

    [HttpDelete("{id:guid}/members/{memberId:guid}")] // 移除指定成員；TA 只能移除 Member。
    public async Task<IActionResult> RemoveMember(Guid id, Guid memberId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.RemoveMemberAsync(id, userId.Value, memberId));
    }

    [HttpDelete("{id:guid}/members/me")] // 退出者取自登入身分；Owner 不可退出。
    public async Task<IActionResult> Leave(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.LeaveAsync(id, userId.Value));
    }

    [HttpGet("{id:guid}/members")] // 成員姓名與 Email 僅供同課程成員查閱。
    public async Task<ActionResult<CourseMemberDto[]>> GetMembers(Guid id)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();
        return ToActionResult(await _service.GetMembersAsync(id, userId.Value));
    }

    private ActionResult<T> ToActionResult<T>(ServiceResult<T> result) => result.Status switch // 將含資料的業務結果轉為 HTTP 回應。
    {
        ServiceResultStatus.Success => Ok(result.Value),
        ServiceResultStatus.Invalid => BadRequest(new { message = result.Error }),
        ServiceResultStatus.Forbidden => Forbid(),
        ServiceResultStatus.NotFound => NotFound(new { message = result.Error }),
        ServiceResultStatus.Conflict => Conflict(new { message = result.Error }),
        _ => StatusCode(StatusCodes.Status500InternalServerError)
    };

    private IActionResult ToActionResult(ServiceResult result) => result.Status switch // 無回傳資料的成功操作使用 204。
    {
        ServiceResultStatus.Success => NoContent(),
        ServiceResultStatus.Invalid => BadRequest(new { message = result.Error }),
        ServiceResultStatus.Forbidden => Forbid(),
        ServiceResultStatus.NotFound => NotFound(new { message = result.Error }),
        ServiceResultStatus.Conflict => Conflict(new { message = result.Error }),
        _ => StatusCode(StatusCodes.Status500InternalServerError)
    };

    private Guid? GetUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value; // 操作者身分取自驗證後的 Claims，不接受前端指定。
        return Guid.TryParse(claim, out var id) ? id : null; // 缺少或無效的使用者 ID 交由端點回傳 401。
    }
}

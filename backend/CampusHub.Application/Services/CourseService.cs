using CampusHub.Application.Common;
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class CourseService : ICourseService // 處理課程資訊、加入流程與成員權限管理。
{
    private readonly IApplicationDbContext _context; // 透過介面操作資料，避免依賴特定資料庫實作。

    public CourseService(IApplicationDbContext context) => _context = context;

    public async Task<ServiceResult<CourseDto>> CreateAsync(Guid ownerId, CreateCourseRequest request) // 建立課程，並將建立者設為 Owner。
    {
        var name = request.Name.Trim();
        var code = NormalizeCode(request.Code);
        if (name.Length == 0 || code.Length == 0)
        {
            return ServiceResult<CourseDto>.Invalid("課程名稱與代碼不可空白。");
        }

        if (await _context.Courses.AnyAsync(course => course.Code == code))
        {
            return ServiceResult<CourseDto>.Conflict("課程代碼已存在。");
        }

        var course = new Course
        {
            Name = name,
            Code = code,
            Description = request.Description?.Trim()
        };
        _context.Courses.Add(course);
        _context.CourseMembers.Add(new CourseMember
        {
            CourseId = course.Id,
            UserId = ownerId,
            Role = CourseRole.Owner // 建立者自動成為 Owner。
        });
        await _context.SaveChangesAsync(); // 同一次儲存提交課程與 Owner，避免只建立其中一筆。
        return ServiceResult<CourseDto>.Success(ToDto(course));
    }

    public async Task<ServiceResult<CourseDto>> GetByIdAsync(Guid id, Guid userId) // 查詢單一課程，限該課程成員。
    {
        var course = await _context.Courses.FindAsync(id);
        if (course == null)
        {
            return ServiceResult<CourseDto>.NotFound("找不到課程。");
        }

        if (!await IsMemberAsync(id, userId)) // 登入不等於有權查看此課程。
        {
            return ServiceResult<CourseDto>.Forbidden();
        }

        return ServiceResult<CourseDto>.Success(ToDto(course));
    }

    public async Task<CourseDto[]> GetByUserAsync(Guid userId) // 列出使用者建立或加入的課程。
    {
        return await _context.CourseMembers
            .Where(m => m.UserId == userId) // 以成員關係取得自己的課程，包含自己建立的課程。
            .OrderBy(m => m.Course.Name)
            .Select(m => new CourseDto
            {
                Id = m.Course.Id,
                Name = m.Course.Name,
                Code = m.Course.Code,
                Description = m.Course.Description
            })
            .ToArrayAsync();
    }

    public async Task<ServiceResult<CourseDto>> UpdateAsync(Guid courseId, Guid userId, UpdateCourseRequest request) // Owner 修改課程名稱與說明。
    {
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null)
        {
            return ServiceResult<CourseDto>.NotFound("找不到課程。");
        }

        if (!await HasRoleAsync(courseId, userId, CourseRole.Owner)) // TA 也不能修改課程資訊。
        {
            return ServiceResult<CourseDto>.Forbidden();
        }

        if (request.Name != null)
        {
            var name = request.Name.Trim();
            if (name.Length == 0)
            {
                return ServiceResult<CourseDto>.Invalid("課程名稱不可空白。");
            }

            course.Name = name;
        }

        if (request.Description != null) // null 表示不修改；空字串表示清空說明。
        {
            course.Description = request.Description.Trim();
        }

        await _context.SaveChangesAsync();
        return ServiceResult<CourseDto>.Success(ToDto(course));
    }

    public async Task<ServiceResult> JoinAsync(Guid userId, JoinCourseRequest request) // 使用課程代碼直接加入，角色預設為 Member。
    {
        var code = NormalizeCode(request.Code);
        if (code.Length == 0)
        {
            return ServiceResult.Invalid("課程代碼不可空白。");
        }

        var courseId = await _context.Courses
            .Where(course => course.Code == code)
            .Select(course => (Guid?)course.Id) // 查無課程時回傳 null，而非 Guid.Empty。
            .FirstOrDefaultAsync();
        if (courseId == null)
        {
            return ServiceResult.NotFound("找不到課程。");
        }

        if (await IsMemberAsync(courseId.Value, userId))
        {
            return ServiceResult.Conflict("你已加入此課程。");
        }

        _context.CourseMembers.Add(new CourseMember
        {
            CourseId = courseId.Value,
            UserId = userId // 直接加入，不需審核；角色預設為 Member。
        });
        await _context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult> AddMemberAsync(Guid courseId, Guid operatorId, AddMemberRequest request) // 管理者新增指定使用者；TA 只能新增 Member。
    {
        var operatorRole = await GetRoleAsync(courseId, operatorId);
        if (operatorRole == null)
        {
            return await GetMissingMembershipResultAsync(courseId);
        }
        if (!TryParseAssignableRole(request.Role, out var targetRole))
        {
            return ServiceResult.Invalid("角色必須是 TA 或 Member。");
        }

        if (!CanManageMember(operatorRole.Value, targetRole))
        {
            return ServiceResult.Forbidden();
        }
        if (!await _context.Users.AnyAsync(user => user.Id == request.UserId))
        {
            return ServiceResult.NotFound("找不到使用者。");
        }

        if (await IsMemberAsync(courseId, request.UserId))
        {
            return ServiceResult.Conflict("使用者已是課程成員。");
        }

        _context.CourseMembers.Add(new CourseMember
        {
            CourseId = courseId,
            UserId = request.UserId,
            Role = targetRole
        });
        await _context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult> UpdateMemberRoleAsync(Guid courseId, Guid operatorId, Guid userId, UpdateMemberRoleRequest request) // Owner 調整成員角色，不轉移擁有權。
    {
        if (!await CourseExistsAsync(courseId))
        {
            return ServiceResult.NotFound("找不到課程。");
        }

        if (!await HasRoleAsync(courseId, operatorId, CourseRole.Owner)) // 只有 Owner 可調整成員角色。
        {
            return ServiceResult.Forbidden();
        }

        if (!TryParseAssignableRole(request.Role, out var targetRole))
        {
            return ServiceResult.Invalid("角色必須是 TA 或 Member。");
        }

        var member = await FindMemberAsync(courseId, userId);
        if (member == null)
        {
            return ServiceResult.NotFound("找不到課程成員。");
        }

        if (member.Role == CourseRole.Owner) // 一般角色修改不可用來轉移擁有權。
        {
            return ServiceResult.Invalid("Owner 角色不可修改。");
        }

        if (member.Role == targetRole)
        {
            return ServiceResult.Conflict("成員已具有此角色。");
        }

        member.Role = targetRole;
        await _context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult> RemoveMemberAsync(Guid courseId, Guid operatorId, Guid userId) // 管理者移除指定成員；Owner 不可被移除。
    {
        var operatorRole = await GetRoleAsync(courseId, operatorId);
        if (operatorRole == null)
        {
            return await GetMissingMembershipResultAsync(courseId);
        }
        if (operatorRole == CourseRole.Member)
        {
            return ServiceResult.Forbidden();
        }

        var member = await FindMemberAsync(courseId, userId);
        if (member == null)
        {
            return ServiceResult.NotFound("找不到課程成員。");
        }

        if (member.Role == CourseRole.Owner)
        {
            return ServiceResult.Invalid("Owner 不可被移除。");
        }

        if (!CanManageMember(operatorRole.Value, member.Role))
        {
            return ServiceResult.Forbidden();
        }

        _context.CourseMembers.Remove(member);
        await _context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult> LeaveAsync(Guid courseId, Guid userId) // TA 或 Member 自行退出課程。
    {
        if (!await CourseExistsAsync(courseId))
        {
            return ServiceResult.NotFound("找不到課程。");
        }

        var member = await FindMemberAsync(courseId, userId);
        if (member == null)
        {
            return ServiceResult.NotFound("你不是此課程成員。");
        }

        if (member.Role == CourseRole.Owner) // 避免課程失去管理者。
        {
            return ServiceResult.Invalid("Owner 不可退出課程。");
        }

        _context.CourseMembers.Remove(member);
        await _context.SaveChangesAsync();
        return ServiceResult.Success();
    }

    public async Task<ServiceResult<CourseMemberDto[]>> GetMembersAsync(Guid courseId, Guid userId) // 查詢課程全部成員，包含自己，限同課程成員。
    {
        if (!await CourseExistsAsync(courseId))
        {
            return ServiceResult<CourseMemberDto[]>.NotFound("找不到課程。");
        }

        if (!await IsMemberAsync(courseId, userId)) // 成員姓名與 Email 不開放給非成員。
        {
            return ServiceResult<CourseMemberDto[]>.Forbidden();
        }

        var members = await _context.CourseMembers
            .Where(m => m.CourseId == courseId)
            .OrderBy(m => m.Role) // 依 Owner、TA、Member 排序。
            .ThenBy(m => m.User.Name)
            .Select(m => new CourseMemberDto
            {
                UserId = m.UserId,
                Name = m.User.Name,
                Email = m.User.Email!,
                Role = m.Role.ToString(),
                JoinedAt = m.JoinedAt
            })
            .ToArrayAsync();
        return ServiceResult<CourseMemberDto[]>.Success(members);
    }

    private Task<bool> CourseExistsAsync(Guid courseId) // 檢查指定課程是否存在。
        => _context.Courses.AnyAsync(course => course.Id == courseId);

    private Task<CourseMember?> FindMemberAsync(Guid courseId, Guid userId) // 取得指定課程中的成員資料，供修改或移除。
        => _context.CourseMembers.FirstOrDefaultAsync(member => member.CourseId == courseId && member.UserId == userId);

    private Task<bool> IsMemberAsync(Guid courseId, Guid userId) // 檢查使用者是否已加入此課程。
        => _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId);

    private Task<bool> HasRoleAsync(Guid courseId, Guid userId, params CourseRole[] roles) // 檢查使用者是否具有任一指定角色。
        => _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId && roles.Contains(m.Role)); // 權限以該課程的角色為準。

    private Task<CourseRole?> GetRoleAsync(Guid courseId, Guid userId) // 查詢使用者在此課程中的角色。
        => _context.CourseMembers
            .Where(member => member.CourseId == courseId && member.UserId == userId)
            .Select(member => (CourseRole?)member.Role) // 非成員回傳 null，避免誤判為 Owner。
            .FirstOrDefaultAsync();

    private async Task<ServiceResult> GetMissingMembershipResultAsync(Guid courseId) // 區分課程不存在與操作者不是成員。
    {
        if (!await CourseExistsAsync(courseId))
        {
            return ServiceResult.NotFound("找不到課程。");
        }

        return ServiceResult.Forbidden(); // 課程存在但操作者不是成員。
    }

    private static bool CanManageMember(CourseRole operatorRole, CourseRole targetRole) // 判斷操作者能否管理目標角色的成員。
        => operatorRole == CourseRole.Owner
            || (operatorRole == CourseRole.TA && targetRole == CourseRole.Member); // TA 只能管理 Member。

    private static bool TryParseAssignableRole(string roleName, out CourseRole role) // 將角色文字轉為 enum，排除直接指派 Owner。
        => Enum.TryParse(roleName, true, out role) && role != CourseRole.Owner; // 共用角色解析，保留既有大小寫與數值解析行為。

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant(); // 統一課程代碼格式，讓加入課程時不受大小寫與頭尾空白影響。

    private static CourseDto ToDto(Course course) => new() // 僅回傳 API 欄位，不傳出 Entity 的關聯集合。
    {
        Id = course.Id,
        Name = course.Name,
        Code = course.Code,
        Description = course.Description
    };
}

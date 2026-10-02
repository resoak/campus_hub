using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class CourseService : ICourseService
{
    private readonly IApplicationDbContext _context;

    public CourseService(IApplicationDbContext context) => _context = context;

    public async Task<CourseDto> CreateAsync(Guid ownerId, CreateCourseRequest request)
    {
        var course = new Course { Name = request.Name, Code = request.Code, Description = request.Description };
        _context.Courses.Add(course);
        _context.CourseMembers.Add(new CourseMember { CourseId = course.Id, UserId = ownerId, Role = CourseRole.Owner });
        await _context.SaveChangesAsync();
        return ToDto(course);
    }

    public async Task<CourseDto?> GetByIdAsync(Guid id)
    {
        var course = await _context.Courses.FindAsync(id);
        return course == null ? null : ToDto(course);
    }

    public async Task<CourseDto[]> GetByUserAsync(Guid userId)
    {
        return await _context.CourseMembers
            .Where(m => m.UserId == userId)
            .Select(m => new CourseDto { Id = m.Course.Id, Name = m.Course.Name, Code = m.Course.Code, Description = m.Course.Description })
            .ToArrayAsync();
    }

    public async Task<CourseDto?> UpdateAsync(Guid courseId, Guid userId, UpdateCourseRequest request)
    {
        if (!await HasRoleAsync(courseId, userId, CourseRole.Owner)) return null;
        var course = await _context.Courses.FindAsync(courseId);
        if (course == null) return null;
        if (request.Name != null) course.Name = request.Name;
        if (request.Description != null) course.Description = request.Description;
        await _context.SaveChangesAsync();
        return ToDto(course);
    }

    public async Task<bool> AddMemberAsync(Guid courseId, Guid operatorId, AddMemberRequest request)
    {
        // 只有 Owner/TA 能新增成員
        if (!await HasRoleAsync(courseId, operatorId, CourseRole.Owner, CourseRole.TA)) return false;
        if (await _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == request.UserId)) return false;
        if (!Enum.TryParse<CourseRole>(request.Role, true, out var role)) return false;
        if (role == CourseRole.Owner) return false; // Owner 不可轉讓，避免同課程多個 Owner
        _context.CourseMembers.Add(new CourseMember { CourseId = courseId, UserId = request.UserId, Role = role });
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RemoveMemberAsync(Guid courseId, Guid operatorId, Guid userId)
    {
        if (!await HasRoleAsync(courseId, operatorId, CourseRole.Owner, CourseRole.TA)) return false;
        var member = await _context.CourseMembers.FirstOrDefaultAsync(m => m.CourseId == courseId && m.UserId == userId);
        if (member == null || member.Role == CourseRole.Owner) return false;
        _context.CourseMembers.Remove(member);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<CourseMemberDto[]> GetMembersAsync(Guid courseId)
    {
        return await _context.CourseMembers
            .Where(m => m.CourseId == courseId)
            .Select(m => new CourseMemberDto { UserId = m.UserId, Name = m.User.Name, Email = m.User.Email!, Role = m.Role.ToString(), JoinedAt = m.JoinedAt })
            .ToArrayAsync();
    }

    private async Task<bool> HasRoleAsync(Guid courseId, Guid userId, params CourseRole[] roles)
        => await _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId && roles.Contains(m.Role));

    private static CourseDto ToDto(Course c) => new() { Id = c.Id, Name = c.Name, Code = c.Code, Description = c.Description };
}

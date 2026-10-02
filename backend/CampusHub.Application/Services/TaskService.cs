using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using TaskStatus = CampusHub.Domain.Enums.TaskStatus;

namespace CampusHub.Application.Services;

public class TaskService : ITaskService
{
    private readonly IApplicationDbContext _context;

    public TaskService(IApplicationDbContext context) => _context = context;

    public async Task<TaskDto> CreateAsync(Guid creatorId, CreateTaskRequest request)
    {
        if (!await IsMemberAsync(request.CourseId, creatorId))
            throw new UnauthorizedAccessException("非課程成員");
        var task = new TaskItem
        {
            CourseId = request.CourseId, AssigneeId = request.AssigneeId,
            Title = request.Title, Description = request.Description, DueDate = request.DueDate
        };
        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        return ToDto(task);
    }

    public async Task<TaskDto?> GetByIdAsync(Guid id)
        => (await _context.Tasks.FindAsync(id)) is { } t ? ToDto(t) : null;

    public async Task<TaskDto[]> GetByCourseAsync(Guid courseId)
        => await _context.Tasks.Where(t => t.CourseId == courseId)
            .OrderBy(t => t.DueDate)
            .Select(t => ToDto(t)).ToArrayAsync();

    public async Task<TaskDto?> UpdateAsync(Guid taskId, Guid userId, UpdateTaskRequest request)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null) return null;
        if (!await IsMemberAsync(task.CourseId, userId)) return null;
        if (request.AssigneeId != null) task.AssigneeId = request.AssigneeId;
        if (request.Title != null) task.Title = request.Title;
        if (request.Description != null) task.Description = request.Description;
        if (request.Status != null && Enum.TryParse<TaskStatus>(request.Status, true, out var status)) task.Status = status;
        if (request.DueDate != null) task.DueDate = request.DueDate;
        await _context.SaveChangesAsync();
        return ToDto(task);
    }

    public async Task<bool> DeleteAsync(Guid taskId, Guid userId)
    {
        var task = await _context.Tasks.FindAsync(taskId);
        if (task == null || !await IsMemberAsync(task.CourseId, userId)) return false;
        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }

    private Task<bool> IsMemberAsync(Guid courseId, Guid userId)
        => _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId);

    private static TaskDto ToDto(TaskItem t) => new()
    {
        Id = t.Id, CourseId = t.CourseId, AssigneeId = t.AssigneeId,
        Title = t.Title, Description = t.Description, Status = t.Status.ToString(),
        DueDate = t.DueDate, CreatedAt = t.CreatedAt
    };
}

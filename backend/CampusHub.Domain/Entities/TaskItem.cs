namespace CampusHub.Domain.Entities;

// 任務 — 看板卡片；TaskStatus 限 Todo/Doing/Done，Assignee 可為空（未指派）
public class TaskItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    public Guid? AssigneeId { get; set; }
    public virtual User? Assignee { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public CampusHub.Domain.Enums.TaskStatus Status { get; set; } = CampusHub.Domain.Enums.TaskStatus.Todo;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

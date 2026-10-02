using CampusHub.Domain.Enums;

namespace CampusHub.Domain.Entities;

// 課程 — 由一名 Owner 建立，成員透過 CourseMembers 加入
public class Course
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }

    public virtual ICollection<CourseMember> Members { get; set; } = new List<CourseMember>();
    public virtual ICollection<Note> Notes { get; set; } = new List<Note>();
    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
    public virtual ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
}

// 課程成員 — (CourseId, UserId) 複合主鍵，Role 限 Owner/TA/Member
public class CourseMember
{
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public CourseRole Role { get; set; } = CourseRole.Member;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}

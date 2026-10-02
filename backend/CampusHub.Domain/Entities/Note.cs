namespace CampusHub.Domain.Entities;

// 筆記 — 課程內的學習筆記，作者可編輯刪除
public class Note
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

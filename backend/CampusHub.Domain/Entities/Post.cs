namespace CampusHub.Domain.Entities;

// 討論區文章
public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CourseId { get; set; }
    public virtual Course Course { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
}

// 留言 — 掛在文章底下
public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

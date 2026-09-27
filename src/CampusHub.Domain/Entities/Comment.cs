using CampusHub.Domain.Enums;

namespace CampusHub.Domain.Entities;

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Content { get; set; } = string.Empty;
    public Guid PostId { get; set; }
    public virtual Post Post { get; set; } = null!;
    public Guid AuthorId { get; set; }
    public virtual User Author { get; set; } = null!;
    public Guid? ParentId { get; set; }
    public virtual Comment? Parent { get; set; }
    public int LikeCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public virtual ICollection<Comment> Replies { get; set; } = new List<Comment>();
    public virtual ICollection<Like> Likes { get; set; } = new List<Like>();
}

public class Like
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
    public LikeTargetType TargetType { get; set; }
    public Guid TargetId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
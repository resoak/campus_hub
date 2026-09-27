using System.ComponentModel.DataAnnotations;

namespace CampusHub.Application.DTOs;

public class CreateCommentRequest
{
    [Required]
    [StringLength(5000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public Guid PostId { get; set; }

    public Guid? ParentId { get; set; }
}

public class UpdateCommentRequest
{
    [Required]
    [StringLength(5000, MinimumLength = 1)]
    public string Content { get; set; } = string.Empty;
}

public class CommentDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid PostId { get; set; }
    public UserDto Author { get; set; } = null!;
    public Guid? ParentId { get; set; }
    public CommentDto[]? Replies { get; set; }
    public int LikeCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class SearchRequest
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string Query { get; set; } = string.Empty;

    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? CategoryId { get; set; }
    public Guid[]? TagIds { get; set; }
    public string SortBy { get; set; } = "latest";
}
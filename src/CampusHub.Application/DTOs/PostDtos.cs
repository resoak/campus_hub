using System.ComponentModel.DataAnnotations;

namespace CampusHub.Application.DTOs;

public class CreatePostRequest
{
    [Required]
    [StringLength(200, MinimumLength = 5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [StringLength(10000, MinimumLength = 20)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public Guid CategoryId { get; set; }

    public Guid[] TagIds { get; set; } = [];
}

public class UpdatePostRequest
{
    [StringLength(200, MinimumLength = 5)]
    public string? Title { get; set; }

    [StringLength(10000, MinimumLength = 20)]
    public string? Content { get; set; }

    public Guid? CategoryId { get; set; }

    public Guid[]? TagIds { get; set; }
}

public class PostFilters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public Guid? CategoryId { get; set; }
    public Guid[]? TagIds { get; set; }
    public string? Search { get; set; }
    public Guid? AuthorId { get; set; }
    public string SortBy { get; set; } = "latest"; // latest, popular, trending
}

public class PostDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public UserDto Author { get; set; } = null!;
    public CategoryDto Category { get; set; } = null!;
    public TagDto[] Tags { get; set; } = [];
    public int LikeCount { get; set; }
    public int CommentCount { get; set; }
    public int ViewCount { get; set; }
    public bool IsPinned { get; set; }
    public bool IsEssence { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Color { get; set; } = string.Empty;
    public int PostCount { get; set; }
}

public class TagDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int PostCount { get; set; }
}

public class PaginatedResponse<T>
{
    public T[] Data { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class LikeResponse
{
    public int LikeCount { get; set; }
    public bool IsLiked { get; set; }
}
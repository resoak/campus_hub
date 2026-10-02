using System.ComponentModel.DataAnnotations;

namespace CampusHub.Application.DTOs;

public class CourseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class CreateCourseRequest
{
    [Required][StringLength(200)] public string Name { get; set; } = string.Empty;
    [Required][StringLength(50)] public string Code { get; set; } = string.Empty;
    [StringLength(1000)] public string? Description { get; set; }
}

public class UpdateCourseRequest
{
    [StringLength(200)] public string? Name { get; set; }
    [StringLength(1000)] public string? Description { get; set; }
}

public class CourseMemberDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}

public class AddMemberRequest
{
    [Required] public Guid UserId { get; set; }
    [Required] public string Role { get; set; } = "Member";
}

public class JoinCourseRequest
{
    [Required][StringLength(50)] public string Code { get; set; } = string.Empty;
}

public class UpdateMemberRoleRequest
{
    [Required] public string Role { get; set; } = string.Empty;
}

public class NoteDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateNoteRequest
{
    [Required] public Guid CourseId { get; set; }
    [Required][StringLength(200)] public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
}

public class UpdateNoteRequest
{
    [StringLength(200)] public string? Title { get; set; }
    public string? Content { get; set; }
}

public class PostDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid AuthorId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePostRequest
{
    [Required] public Guid CourseId { get; set; }
    [Required][StringLength(200)] public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
}

public class UpdatePostRequest
{
    [StringLength(200)] public string? Title { get; set; }
    public string? Content { get; set; }
}

public class CommentDto
{
    public Guid Id { get; set; }
    public Guid PostId { get; set; }
    public Guid AuthorId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class CreateCommentRequest
{
    [Required] public Guid PostId { get; set; }
    [Required][StringLength(2000)] public string Content { get; set; } = string.Empty;
}

public class TaskDto
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid? AssigneeId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? DueDate { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateTaskRequest
{
    [Required] public Guid CourseId { get; set; }
    public Guid? AssigneeId { get; set; }
    [Required][StringLength(200)] public string Title { get; set; } = string.Empty;
    [StringLength(2000)] public string? Description { get; set; }
    public DateTime? DueDate { get; set; }
}

public class UpdateTaskRequest
{
    public Guid? AssigneeId { get; set; }
    [StringLength(200)] public string? Title { get; set; }
    [StringLength(2000)] public string? Description { get; set; }
    public string? Status { get; set; }
    public DateTime? DueDate { get; set; }
}

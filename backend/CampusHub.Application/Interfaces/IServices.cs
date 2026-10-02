using CampusHub.Application.DTOs;
using CampusHub.Application.Common;

namespace CampusHub.Application.Interfaces;

public interface ICourseService
{
    Task<ServiceResult<CourseDto>> CreateAsync(Guid ownerId, CreateCourseRequest request);
    Task<ServiceResult<CourseDto>> GetByIdAsync(Guid id, Guid userId);
    Task<CourseDto[]> GetByUserAsync(Guid userId);
    Task<ServiceResult<CourseDto>> UpdateAsync(Guid courseId, Guid userId, UpdateCourseRequest request);
    Task<ServiceResult> JoinAsync(Guid userId, JoinCourseRequest request);
    Task<ServiceResult> AddMemberAsync(Guid courseId, Guid operatorId, AddMemberRequest request);
    Task<ServiceResult> UpdateMemberRoleAsync(Guid courseId, Guid operatorId, Guid userId, UpdateMemberRoleRequest request);
    Task<ServiceResult> RemoveMemberAsync(Guid courseId, Guid operatorId, Guid userId);
    Task<ServiceResult> LeaveAsync(Guid courseId, Guid userId);
    Task<ServiceResult<CourseMemberDto[]>> GetMembersAsync(Guid courseId, Guid userId);
}

public interface INoteService
{
    Task<NoteDto> CreateAsync(Guid authorId, CreateNoteRequest request);
    Task<NoteDto?> GetByIdAsync(Guid id);
    Task<NoteDto[]> GetByCourseAsync(Guid courseId);
    Task<NoteDto?> UpdateAsync(Guid noteId, Guid userId, UpdateNoteRequest request);
    Task<bool> DeleteAsync(Guid noteId, Guid userId);
}

public interface IPostService
{
    Task<PostDto> CreateAsync(Guid authorId, CreatePostRequest request);
    Task<PostDto?> GetByIdAsync(Guid id);
    Task<PostDto[]> GetByCourseAsync(Guid courseId);
    Task<PostDto?> UpdateAsync(Guid postId, Guid userId, UpdatePostRequest request);
    Task<bool> DeleteAsync(Guid postId, Guid userId);
}

public interface ICommentService
{
    Task<CommentDto[]> GetByPostAsync(Guid postId);
    Task<CommentDto> CreateAsync(Guid authorId, CreateCommentRequest request);
    Task<bool> DeleteAsync(Guid commentId, Guid userId);
}

public interface ITaskService
{
    Task<TaskDto> CreateAsync(Guid creatorId, CreateTaskRequest request);
    Task<TaskDto?> GetByIdAsync(Guid id);
    Task<TaskDto[]> GetByCourseAsync(Guid courseId);
    Task<TaskDto?> UpdateAsync(Guid taskId, Guid userId, UpdateTaskRequest request);
    Task<bool> DeleteAsync(Guid taskId, Guid userId);
}

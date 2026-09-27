using CampusHub.Application.DTOs;

namespace CampusHub.Application.Interfaces;

public interface IPostService
{
    Task<PaginatedResponse<PostDto>> GetPostsAsync(PostFilters filters);
    Task<PostDto?> GetPostByIdAsync(Guid id, Guid? currentUserId = null);
    Task<PostDto> CreatePostAsync(Guid authorId, CreatePostRequest request);
    Task<PostDto> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request);
    Task<bool> DeletePostAsync(Guid postId, Guid userId, bool isAdmin = false);
    Task<LikeResponse> LikePostAsync(Guid postId, Guid userId);
    Task<LikeResponse> UnlikePostAsync(Guid postId, Guid userId);
    Task IncrementViewCountAsync(Guid postId);
}

public interface ICommentService
{
    Task<CommentDto[]> GetCommentsByPostAsync(Guid postId);
    Task<CommentDto> CreateCommentAsync(Guid authorId, CreateCommentRequest request);
    Task<CommentDto> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request);
    Task<bool> DeleteCommentAsync(Guid commentId, Guid userId, bool isAdmin = false);
    Task<LikeResponse> LikeCommentAsync(Guid commentId, Guid userId);
    Task<LikeResponse> UnlikeCommentAsync(Guid commentId, Guid userId);
}

public interface ICategoryService
{
    Task<CategoryDto[]> GetAllCategoriesAsync();
    Task<CategoryDto?> GetCategoryByIdAsync(Guid id);
    Task<CategoryDto?> GetCategoryBySlugAsync(string slug);
}

public interface ITagService
{
    Task<TagDto[]> GetAllTagsAsync();
    Task<TagDto[]> GetPopularTagsAsync(int limit = 20);
    Task<TagDto?> GetTagByIdAsync(Guid id);
    Task<TagDto?> GetTagBySlugAsync(string slug);
}

public interface ISearchService
{
    Task<PaginatedResponse<PostDto>> SearchPostsAsync(SearchRequest request);
}
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class PostService : IPostService
{
    private readonly IApplicationDbContext _context;

    public PostService(IApplicationDbContext context) => _context = context;

    public async Task<PostDto> CreateAsync(Guid authorId, CreatePostRequest request)
    {
        if (!await IsMemberAsync(request.CourseId, authorId))
            throw new UnauthorizedAccessException("非課程成員");
        var post = new Post { CourseId = request.CourseId, AuthorId = authorId, Title = request.Title, Content = request.Content };
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();
        return ToDto(post);
    }

    public async Task<PostDto?> GetByIdAsync(Guid id)
        => (await _context.Posts.FindAsync(id)) is { } p ? ToDto(p) : null;

    public async Task<PostDto[]> GetByCourseAsync(Guid courseId)
        => await _context.Posts.Where(p => p.CourseId == courseId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => ToDto(p)).ToArrayAsync();

    public async Task<PostDto?> UpdateAsync(Guid postId, Guid userId, UpdatePostRequest request)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null || post.AuthorId != userId) return null;
        if (request.Title != null) post.Title = request.Title;
        if (request.Content != null) post.Content = request.Content;
        await _context.SaveChangesAsync();
        return ToDto(post);
    }

    public async Task<bool> DeleteAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post == null || post.AuthorId != userId) return false;
        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();
        return true;
    }

    private Task<bool> IsMemberAsync(Guid courseId, Guid userId)
        => _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId);

    private static PostDto ToDto(Post p) => new()
    {
        Id = p.Id, CourseId = p.CourseId, AuthorId = p.AuthorId,
        Title = p.Title, Content = p.Content, CreatedAt = p.CreatedAt
    };
}

using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class CommentService : ICommentService
{
    private readonly IApplicationDbContext _context;

    public CommentService(IApplicationDbContext context) => _context = context;

    public async Task<CommentDto[]> GetByPostAsync(Guid postId)
        => await _context.Comments.Where(c => c.PostId == postId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto { Id = c.Id, PostId = c.PostId, AuthorId = c.AuthorId, Content = c.Content, CreatedAt = c.CreatedAt })
            .ToArrayAsync();

    public async Task<CommentDto> CreateAsync(Guid authorId, CreateCommentRequest request)
    {
        var post = await _context.Posts.FindAsync(request.PostId);
        if (post == null) throw new KeyNotFoundException("貼文不存在");
        var comment = new Comment { PostId = request.PostId, AuthorId = authorId, Content = request.Content };
        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();
        return new CommentDto { Id = comment.Id, PostId = comment.PostId, AuthorId = authorId, Content = comment.Content, CreatedAt = comment.CreatedAt };
    }

    public async Task<bool> DeleteAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null || comment.AuthorId != userId) return false;
        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
        return true;
    }
}

using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class CommentService : ICommentService
{
    private readonly IApplicationDbContext _context;

    public CommentService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CommentDto[]> GetCommentsByPostAsync(Guid postId)
    {
        var comments = await _context.Comments
            .Include(c => c.Author)
            .Include(c => c.Replies)
                .ThenInclude(r => r.Author)
            .Where(c => c.PostId == postId && c.ParentId == null)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(MapToDto).ToArray();
    }

    public async Task<CommentDto> CreateCommentAsync(Guid authorId, CreateCommentRequest request)
    {
        var post = await _context.Posts.FindAsync(request.PostId);
        if (post == null)
            throw new ArgumentException("文章不存在");

        Comment? parent = null;
        if (request.ParentId.HasValue)
        {
            parent = await _context.Comments.FindAsync(request.ParentId.Value);
            if (parent == null)
                throw new ArgumentException("回覆的留言不存在");
        }

        var comment = new Comment
        {
            Content = request.Content,
            PostId = request.PostId,
            AuthorId = authorId,
            ParentId = request.ParentId,
        };

        _context.Comments.Add(comment);
        
        // Increment post comment count
        post.CommentCount++;
        
        await _context.SaveChangesAsync();

        return await GetCommentByIdAsync(comment.Id) ?? throw new InvalidOperationException("建立留言失敗");
    }

    public async Task<CommentDto> UpdateCommentAsync(Guid commentId, Guid userId, UpdateCommentRequest request)
    {
        var comment = await _context.Comments
            .Include(c => c.Author)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
            throw new ArgumentException("留言不存在");

        if (comment.AuthorId != userId)
            throw new UnauthorizedAccessException("無權限編輯此留言");

        comment.Content = request.Content;
        comment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return MapToDto(comment);
    }

    public async Task<bool> DeleteCommentAsync(Guid commentId, Guid userId, bool isAdmin = false)
    {
        var comment = await _context.Comments
            .Include(c => c.Replies)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null) return false;

        if (!isAdmin && comment.AuthorId != userId)
            throw new UnauthorizedAccessException("無權限刪除此留言");

        // Also delete replies (cascade)
        _context.Comments.Remove(comment);

        // Decrement post comment count
        var post = await _context.Posts.FindAsync(comment.PostId);
        if (post != null)
        {
            post.CommentCount = Math.Max(0, post.CommentCount - 1 - comment.Replies.Count);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LikeResponse> LikeCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments
            .Include(c => c.Likes)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
            throw new ArgumentException("留言不存在");

        var existingLike = comment.Likes.FirstOrDefault(l => l.UserId == userId);
        if (existingLike != null)
        {
            return new LikeResponse { LikeCount = comment.LikeCount, IsLiked = true };
        }

        var like = new Like
        {
            UserId = userId,
            TargetType = LikeTargetType.Comment,
            TargetId = commentId,
        };

        comment.Likes.Add(like);
        comment.LikeCount++;
        await _context.SaveChangesAsync();

        return new LikeResponse { LikeCount = comment.LikeCount, IsLiked = true };
    }

    public async Task<LikeResponse> UnlikeCommentAsync(Guid commentId, Guid userId)
    {
        var comment = await _context.Comments
            .Include(c => c.Likes)
            .FirstOrDefaultAsync(c => c.Id == commentId);

        if (comment == null)
            throw new ArgumentException("留言不存在");

        var like = comment.Likes.FirstOrDefault(l => l.UserId == userId);
        if (like == null)
        {
            return new LikeResponse { LikeCount = comment.LikeCount, IsLiked = false };
        }

        comment.Likes.Remove(like);
        comment.LikeCount = Math.Max(0, comment.LikeCount - 1);
        await _context.SaveChangesAsync();

        return new LikeResponse { LikeCount = comment.LikeCount, IsLiked = false };
    }

    private async Task<CommentDto?> GetCommentByIdAsync(Guid id)
    {
        var comment = await _context.Comments
            .Include(c => c.Author)
            .Include(c => c.Replies)
                .ThenInclude(r => r.Author)
            .FirstOrDefaultAsync(c => c.Id == id);

        return comment != null ? MapToDto(comment) : null;
    }

    private static CommentDto MapToDto(Comment comment)
    {
        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            PostId = comment.PostId,
            Author = new UserDto
            {
                Id = comment.Author.Id,
                Username = comment.Author.UserName!,
                Email = comment.Author.Email!,
                AvatarUrl = comment.Author.AvatarUrl,
                Role = comment.Author.Role.ToString(),
                CreatedAt = comment.Author.CreatedAt,
            },
            ParentId = comment.ParentId,
            Replies = comment.Replies?.OrderBy(r => r.CreatedAt).Select(MapToDto).ToArray(),
            LikeCount = comment.LikeCount,
            CreatedAt = comment.CreatedAt,
            UpdatedAt = comment.UpdatedAt,
        };
    }
}
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class PostService : IPostService
{
    private readonly IApplicationDbContext _context;

    public PostService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<PostDto>> GetPostsAsync(PostFilters filters)
    {
        var query = _context.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Where(p => p.Status == PostStatus.Published);

        if (filters.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filters.CategoryId.Value);

        if (filters.TagIds != null && filters.TagIds.Length > 0)
            query = query.Where(p => p.PostTags.Any(pt => filters.TagIds!.Contains(pt.TagId)));

        if (filters.AuthorId.HasValue)
            query = query.Where(p => p.AuthorId == filters.AuthorId.Value);

        if (!string.IsNullOrWhiteSpace(filters.Search))
        {
            var search = filters.Search.ToLower();
            query = query.Where(p => p.Title.ToLower().Contains(search) || p.Content.ToLower().Contains(search));
        }

        // Sorting
        query = filters.SortBy switch
        {
            "popular" => query.OrderByDescending(p => p.LikeCount).ThenByDescending(p => p.CreatedAt),
            "trending" => query.OrderByDescending(p => p.LikeCount + p.CommentCount * 2).ThenByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.IsPinned).ThenByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)filters.PageSize);

        var posts = await query
            .Skip((filters.Page - 1) * filters.PageSize)
            .Take(filters.PageSize)
            .ToListAsync();

        return new PaginatedResponse<PostDto>
        {
            Data = posts.Select(p => MapToDto(p)).ToArray(),
            Total = total,
            Page = filters.Page,
            PageSize = filters.PageSize,
            TotalPages = totalPages,
        };
    }

    public async Task<PostDto?> GetPostByIdAsync(Guid id, Guid? currentUserId = null)
    {
        var post = await _context.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == id && p.Status == PostStatus.Published);

        if (post == null) return null;

        // Check if current user liked the post
        var isLiked = currentUserId.HasValue && post.Likes.Any(l => l.UserId == currentUserId.Value);

        return MapToDto(post, isLiked);
    }

    public async Task<PostDto> CreatePostAsync(Guid authorId, CreatePostRequest request)
    {
        var category = await _context.Categories.FindAsync(request.CategoryId);
        if (category == null)
            throw new ArgumentException("分類不存在");

        var tags = await _context.Tags
            .Where(t => request.TagIds.Contains(t.Id))
            .ToListAsync();

        var post = new Post
        {
            Title = request.Title,
            Content = request.Content,
            Excerpt = GenerateExcerpt(request.Content),
            AuthorId = authorId,
            CategoryId = request.CategoryId,
            Status = PostStatus.Published,
        };

        foreach (var tag in tags)
        {
            post.PostTags.Add(new PostTag { Post = post, Tag = tag });
            tag.PostCount++;
        }

        category.PostCount++;
        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(post.Id, authorId) ?? throw new InvalidOperationException("建立文章失敗");
    }

    public async Task<PostDto> UpdatePostAsync(Guid postId, Guid userId, UpdatePostRequest request)
    {
        var post = await _context.Posts
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            throw new ArgumentException("文章不存在");

        if (post.AuthorId != userId)
            throw new UnauthorizedAccessException("無權限編輯此文章");

        // Update fields
        if (!string.IsNullOrEmpty(request.Title))
            post.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Content))
        {
            post.Content = request.Content;
            post.Excerpt = GenerateExcerpt(request.Content);
        }

        if (request.CategoryId.HasValue)
        {
            var oldCategory = await _context.Categories.FindAsync(post.CategoryId);
            var newCategory = await _context.Categories.FindAsync(request.CategoryId.Value);
            
            if (newCategory == null)
                throw new ArgumentException("分類不存在");

            if (oldCategory != null) oldCategory.PostCount--;
            newCategory.PostCount++;
            post.CategoryId = request.CategoryId.Value;
        }

        if (request.TagIds != null)
        {
            // Remove old tags
            var oldTagIds = post.PostTags.Select(pt => pt.TagId).ToList();
            var removedTags = await _context.Tags.Where(t => oldTagIds.Contains(t.Id)).ToListAsync();
            foreach (var tag in removedTags) tag.PostCount--;

            post.PostTags.Clear();

            // Add new tags
            var newTags = await _context.Tags.Where(t => request.TagIds.Contains(t.Id)).ToListAsync();
            foreach (var tag in newTags)
            {
                post.PostTags.Add(new PostTag { Post = post, Tag = tag });
                tag.PostCount++;
            }
        }

        post.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetPostByIdAsync(post.Id, userId) ?? throw new InvalidOperationException("更新文章失敗");
    }

    public async Task<bool> DeletePostAsync(Guid postId, Guid userId, bool isAdmin = false)
    {
        var post = await _context.Posts
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null) return false;

        if (!isAdmin && post.AuthorId != userId)
            throw new UnauthorizedAccessException("無權限刪除此文章");

        // Decrement tag counts
        foreach (var pt in post.PostTags)
        {
            pt.Tag.PostCount--;
        }

        // Decrement category count
        post.Category.PostCount--;

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<LikeResponse> LikePostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            throw new ArgumentException("文章不存在");

        var existingLike = post.Likes.FirstOrDefault(l => l.UserId == userId);
        if (existingLike != null)
        {
            return new LikeResponse { LikeCount = post.LikeCount, IsLiked = true };
        }

        var like = new Like
        {
            UserId = userId,
            TargetType = LikeTargetType.Post,
            TargetId = postId,
        };

        post.Likes.Add(like);
        post.LikeCount++;
        await _context.SaveChangesAsync();

        return new LikeResponse { LikeCount = post.LikeCount, IsLiked = true };
    }

    public async Task<LikeResponse> UnlikePostAsync(Guid postId, Guid userId)
    {
        var post = await _context.Posts
            .Include(p => p.Likes)
            .FirstOrDefaultAsync(p => p.Id == postId);

        if (post == null)
            throw new ArgumentException("文章不存在");

        var like = post.Likes.FirstOrDefault(l => l.UserId == userId);
        if (like == null)
        {
            return new LikeResponse { LikeCount = post.LikeCount, IsLiked = false };
        }

        post.Likes.Remove(like);
        post.LikeCount = Math.Max(0, post.LikeCount - 1);
        await _context.SaveChangesAsync();

        return new LikeResponse { LikeCount = post.LikeCount, IsLiked = false };
    }

    public async Task IncrementViewCountAsync(Guid postId)
    {
        var post = await _context.Posts.FindAsync(postId);
        if (post != null)
        {
            post.ViewCount++;
            await _context.SaveChangesAsync();
        }
    }

    private static string GenerateExcerpt(string content)
    {
        // Remove markdown syntax for excerpt
        var plainText = content
            .Replace("#", "")
            .Replace("*", "")
            .Replace("_", "")
            .Replace("`", "")
            .Replace("\n", " ")
            .Replace("\r", " ");

        if (plainText.Length <= 200) return plainText;
        return plainText[..200].TrimEnd() + "...";
    }

    private static PostDto MapToDto(Post post, bool? isLiked = null)
    {
        return new PostDto
        {
            Id = post.Id,
            Title = post.Title,
            Content = post.Content,
            Excerpt = post.Excerpt,
            Author = new UserDto
            {
                Id = post.Author.Id,
                Username = post.Author.UserName!,
                Email = post.Author.Email!,
                AvatarUrl = post.Author.AvatarUrl,
                Role = post.Author.Role.ToString(),
                CreatedAt = post.Author.CreatedAt,
            },
            Category = new CategoryDto
            {
                Id = post.Category.Id,
                Name = post.Category.Name,
                Slug = post.Category.Slug,
                Description = post.Category.Description,
                Color = post.Category.Color,
                PostCount = post.Category.PostCount,
            },
            Tags = post.PostTags.Select(pt => new TagDto
            {
                Id = pt.Tag.Id,
                Name = pt.Tag.Name,
                Slug = pt.Tag.Slug,
                Color = pt.Tag.Color,
                PostCount = pt.Tag.PostCount,
            }).ToArray(),
            LikeCount = post.LikeCount,
            CommentCount = post.CommentCount,
            ViewCount = post.ViewCount,
            IsPinned = post.IsPinned,
            IsEssence = post.IsEssence,
            Status = post.Status.ToString(),
            CreatedAt = post.CreatedAt,
            UpdatedAt = post.UpdatedAt,
        };
    }
}
using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class SearchService : ISearchService
{
    private readonly IApplicationDbContext _context;

    public SearchService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResponse<PostDto>> SearchPostsAsync(SearchRequest request)
    {
        var query = _context.Posts
            .Include(p => p.Author)
            .Include(p => p.Category)
            .Include(p => p.PostTags)
                .ThenInclude(pt => pt.Tag)
            .Where(p => p.Status == CampusHub.Domain.Enums.PostStatus.Published);

        if (!string.IsNullOrWhiteSpace(request.Query))
        {
            var search = request.Query.ToLower();
            query = query.Where(p => 
                p.Title.ToLower().Contains(search) || 
                p.Content.ToLower().Contains(search) ||
                p.Author.UserName!.ToLower().Contains(search) ||
                p.PostTags.Any(pt => pt.Tag.Name.ToLower().Contains(search))
            );
        }

        if (request.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == request.CategoryId.Value);

        if (request.TagIds != null && request.TagIds.Length > 0)
            query = query.Where(p => p.PostTags.Any(pt => request.TagIds!.Contains(pt.TagId)));

        // Sorting
        query = request.SortBy switch
        {
            "popular" => query.OrderByDescending(p => p.LikeCount).ThenByDescending(p => p.CreatedAt),
            "trending" => query.OrderByDescending(p => p.LikeCount + p.CommentCount * 2).ThenByDescending(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt),
        };

        var total = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)request.PageSize);

        var posts = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        return new PaginatedResponse<PostDto>
        {
            Data = posts.Select(MapToDto).ToArray(),
            Total = total,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalPages = totalPages,
        };
    }

    private static PostDto MapToDto(CampusHub.Domain.Entities.Post post)
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
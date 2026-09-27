using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class TagService : ITagService
{
    private readonly IApplicationDbContext _context;

    public TagService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<TagDto[]> GetAllTagsAsync()
    {
        return await _context.Tags
            .OrderByDescending(t => t.PostCount)
            .Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                PostCount = t.PostCount,
            })
            .ToArrayAsync();
    }

    public async Task<TagDto[]> GetPopularTagsAsync(int limit = 20)
    {
        return await _context.Tags
            .OrderByDescending(t => t.PostCount)
            .Take(limit)
            .Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                PostCount = t.PostCount,
            })
            .ToArrayAsync();
    }

    public async Task<TagDto?> GetTagByIdAsync(Guid id)
    {
        return await _context.Tags
            .Where(t => t.Id == id)
            .Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                PostCount = t.PostCount,
            })
            .FirstOrDefaultAsync();
    }

    public async Task<TagDto?> GetTagBySlugAsync(string slug)
    {
        return await _context.Tags
            .Where(t => t.Slug == slug)
            .Select(t => new TagDto
            {
                Id = t.Id,
                Name = t.Name,
                Slug = t.Slug,
                Color = t.Color,
                PostCount = t.PostCount,
            })
            .FirstOrDefaultAsync();
    }
}
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Post> Posts { get; }
    DbSet<Category> Categories { get; }
    DbSet<Tag> Tags { get; }
    DbSet<PostTag> PostTags { get; }
    DbSet<Comment> Comments { get; }
    DbSet<Like> Likes { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<User> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
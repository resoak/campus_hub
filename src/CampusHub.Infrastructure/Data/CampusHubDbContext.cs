using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using CampusHub.Infrastructure.Configurations;

namespace CampusHub.Infrastructure.Data;

// EF Core DbContext — 對應 SQLite 資料庫，含 Identity 與種子資料
public class CampusHubDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, IApplicationDbContext
{
    public CampusHubDbContext(DbContextOptions<CampusHubDbContext> options) : base(options)
    {
    }

    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<PostTag> PostTags => Set<PostTag>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Apply all configurations
        builder.ApplyConfigurationsFromAssembly(typeof(CampusHubDbContext).Assembly);

        // Seed data
        SeedData(builder);
    }

    private static void SeedData(ModelBuilder builder)
    {
        // Seed Categories
        var categories = new[]
        {
            new Category { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "校園公告", Slug = "announcements", Description = "校園官方公告與資訊", Color = "#ef4444", SortOrder = 1 },
            new Category { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "課程討論", Slug = "courses", Description = "課程相關討論、心得、問題", Color = "#3b82f6", SortOrder = 2 },
            new Category { Id = Guid.Parse("33333333-3333-3333-3333-333333333333"), Name = "社團活動", Slug = "clubs", Description = "社團招新、活動資訊、心得分享", Color = "#22c55e", SortOrder = 3 },
            new Category { Id = Guid.Parse("44444444-4444-4444-4444-444444444444"), Name = "二手交易", Slug = "marketplace", Description = "校園二手買賣、租賃、徵求", Color = "#f59e0b", SortOrder = 4 },
            new Category { Id = Guid.Parse("55555555-5555-5555-5555-555555555555"), Name = "失物招領", Slug = "lost-found", Description = "遺失物品尋找、招領啟事", Color = "#8b5cf6", SortOrder = 5 },
            new Category { Id = Guid.Parse("66666666-6666-6666-6666-666666666666"), Name = "生活閒聊", Slug = "chat", Description = "校園生活、心情分享、隨意聊天", Color = "#ec4899", SortOrder = 6 },
        };

        builder.Entity<Category>().HasData(categories);

        // Seed Tags
        var tags = new[]
        {
            new Tag { Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Name = "新生", Slug = "freshman", Color = "#22c55e" },
            new Tag { Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Name = "選課", Slug = "course-selection", Color = "#3b82f6" },
            new Tag { Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), Name = "考試", Slug = "exam", Color = "#ef4444" },
            new Tag { Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), Name = "實習", Slug = "internship", Color = "#8b5cf6" },
            new Tag { Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), Name = "畢業", Slug = "graduation", Color = "#f59e0b" },
            new Tag { Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"), Name = "宿舍", Slug = "dormitory", Color = "#ec4899" },
            new Tag { Id = Guid.Parse("12345678-1234-1234-1234-123456789012"), Name = "美食", Slug = "food", Color = "#f97316" },
            new Tag { Id = Guid.Parse("87654321-4321-4321-4321-210987654321"), Name = "交通", Slug = "transport", Color = "#06b6d4" },
        };

        builder.Entity<Tag>().HasData(tags);
    }
}
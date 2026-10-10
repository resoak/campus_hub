using Microsoft.EntityFrameworkCore;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;

namespace CampusHub.Infrastructure.Data;

// 使用一般 DbContext，對應既有 SQL Server 業務資料表。
public class CampusHubDbContext : DbContext, IApplicationDbContext
{
    public CampusHubDbContext(DbContextOptions<CampusHubDbContext> options) : base(options)
    {
    }

    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseMember> CourseMembers => Set<CourseMember>();
    public DbSet<Note> Notes => Set<Note>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(CampusHubDbContext).Assembly);
    }
}

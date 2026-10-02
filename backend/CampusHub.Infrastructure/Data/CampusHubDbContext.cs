using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;

namespace CampusHub.Infrastructure.Data;

// EF Core DbContext — 對應 SQL Server，含 Identity
public class CampusHubDbContext : IdentityDbContext<User, IdentityRole<Guid>, Guid>, IApplicationDbContext
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

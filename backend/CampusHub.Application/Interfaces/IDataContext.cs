using CampusHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Course> Courses { get; }
    DbSet<CourseMember> CourseMembers { get; }
    DbSet<Note> Notes { get; }
    DbSet<Post> Posts { get; }
    DbSet<Comment> Comments { get; }
    DbSet<TaskItem> Tasks { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<User> Users { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

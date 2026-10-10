using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using CampusHub.Domain.Entities;
using TaskStatus = CampusHub.Domain.Enums.TaskStatus;

namespace CampusHub.Infrastructure.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).HasColumnName("User_Id");
        builder.Property(u => u.Name).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(256);
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(512);
        builder.Property(u => u.CreatedAt).HasPrecision(0);
        builder.HasIndex(u => u.Email).IsUnique();
    }
}

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("Courses");
        builder.Property(c => c.Name).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Code).IsRequired().HasMaxLength(50);
        builder.Property(c => c.Description).HasMaxLength(1000);
        builder.HasIndex(c => c.Code).IsUnique();
    }
}

public class CourseMemberConfiguration : IEntityTypeConfiguration<CourseMember>
{
    public void Configure(EntityTypeBuilder<CourseMember> builder)
    {
        builder.ToTable("CourseMembers");
        builder.HasKey(cm => new { cm.CourseId, cm.UserId });
        builder.Property(cm => cm.Role).HasConversion<int>();
        builder.HasCheckConstraint("CK_CourseMember_Role", "[Role] IN (0,1,2)");
        builder.HasOne(cm => cm.Course).WithMany(c => c.Members).HasForeignKey(cm => cm.CourseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(cm => cm.User).WithMany(u => u.CourseMemberships).HasForeignKey(cm => cm.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class NoteConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.ToTable("Notes");
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.HasOne(n => n.Course).WithMany(c => c.Notes).HasForeignKey(n => n.CourseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(n => n.Author).WithMany().HasForeignKey(n => n.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(n => n.CourseId);
    }
}

public class PostConfiguration : IEntityTypeConfiguration<Post>
{
    public void Configure(EntityTypeBuilder<Post> builder)
    {
        builder.ToTable("Posts");
        builder.Property(p => p.Title).IsRequired().HasMaxLength(200);
        builder.HasOne(p => p.Course).WithMany(c => c.Posts).HasForeignKey(p => p.CourseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(p => p.Author).WithMany().HasForeignKey(p => p.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(p => p.CourseId);
    }
}

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.ToTable("Comments");
        builder.Property(c => c.Content).IsRequired().HasMaxLength(2000);
        builder.HasOne(c => c.Post).WithMany(p => p.Comments).HasForeignKey(c => c.PostId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(c => c.Author).WithMany().HasForeignKey(c => c.AuthorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(c => c.PostId);
    }
}

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.ToTable("Tasks");
        builder.Property(t => t.Title).IsRequired().HasMaxLength(200);
        builder.Property(t => t.Status).HasConversion<int>();
        builder.HasCheckConstraint("CK_Task_Status", "[Status] IN (0,1,2)");
        builder.HasOne(t => t.Course).WithMany(c => c.Tasks).HasForeignKey(t => t.CourseId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(t => t.Assignee).WithMany().HasForeignKey(t => t.AssigneeId).OnDelete(DeleteBehavior.SetNull);
        builder.HasIndex(t => t.CourseId);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.Property(rt => rt.Token).IsRequired().HasMaxLength(500);
        builder.HasOne(rt => rt.User).WithMany(u => u.RefreshTokens).HasForeignKey(rt => rt.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasIndex(rt => rt.Token).IsUnique();
        builder.HasIndex(rt => rt.ExpiresAt);
    }
}

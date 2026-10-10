using CampusHub.Application.Common;
using CampusHub.Application.DTOs;
using CampusHub.Application.Services;
using CampusHub.Domain.Entities;
using CampusHub.Domain.Enums;
using CampusHub.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CampusHub.Application.Tests;

public sealed class CourseServiceTests : IDisposable // 驗證課程加入與成員權限規則。
{
    private readonly SqliteConnection _connection;
    private readonly CampusHubDbContext _context;
    private readonly CourseService _service;

    public CourseServiceTests() // 為每個測試建立獨立的記憶體資料庫與服務。
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open(); // 保持連線開啟，避免 SQLite 記憶體資料庫在測試結束前消失。
        var options = new DbContextOptionsBuilder<CampusHubDbContext>()
            .UseSqlite(_connection)
            .Options;
        _context = new CampusHubDbContext(options);
        _context.Database.EnsureCreated();
        _service = new CourseService(_context);
    }

    [Fact]
    public async Task JoinAsync_NormalizesCodeAndAddsMember() // 驗證代碼含小寫與頭尾空白時，仍能以 Member 身分加入。
    {
        var owner = AddUser("owner");
        var student = AddUser("student");
        var course = AddCourse(owner.Id, "CS101");
        await _context.SaveChangesAsync();

        var result = await _service.JoinAsync(student.Id, new JoinCourseRequest { Code = " cs101 " });

        Assert.Equal(ServiceResultStatus.Success, result.Status);
        var membership = await _context.CourseMembers.FindAsync(course.Id, student.Id);
        Assert.Equal(CourseRole.Member, membership?.Role);
    }

    [Fact]
    public async Task JoinAsync_WhenAlreadyMember_ReturnsConflict() // 驗證既有成員重複加入時回傳衝突。
    {
        var owner = AddUser("owner");
        var course = AddCourse(owner.Id, "CS101");
        await _context.SaveChangesAsync();

        var result = await _service.JoinAsync(owner.Id, new JoinCourseRequest { Code = course.Code });

        Assert.Equal(ServiceResultStatus.Conflict, result.Status);
    }

    [Fact]
    public async Task GetMembersAsync_WhenUserIsOutsider_ReturnsForbidden() // 驗證非課程成員不能查閱成員名單。
    {
        var owner = AddUser("owner");
        var outsider = AddUser("outsider");
        var course = AddCourse(owner.Id, "CS101");
        await _context.SaveChangesAsync();

        var result = await _service.GetMembersAsync(course.Id, outsider.Id);

        Assert.Equal(ServiceResultStatus.Forbidden, result.Status);
    }

    [Fact]
    public async Task AddMemberAsync_WhenTaAddsTa_ReturnsForbidden() // 驗證 TA 不能新增另一位 TA，且不會留下成員資料。
    {
        var owner = AddUser("owner");
        var teachingAssistant = AddUser("ta");
        var candidate = AddUser("candidate");
        var course = AddCourse(owner.Id, "CS101");
        AddCourseMember(course.Id, teachingAssistant.Id, CourseRole.TA);
        await _context.SaveChangesAsync();

        var request = new AddMemberRequest
        {
            UserId = candidate.Id,
            Role = "TA"
        };
        var result = await _service.AddMemberAsync(course.Id, teachingAssistant.Id, request);

        Assert.Equal(ServiceResultStatus.Forbidden, result.Status);
        var candidateIsMember = await IsCourseMemberAsync(course.Id, candidate.Id);
        Assert.False(candidateIsMember);
    }

    [Fact]
    public async Task LeaveAsync_WhenUserIsOwner_ReturnsInvalid() // 驗證 Owner 不能退出課程，且原有成員資料仍保留。
    {
        var owner = AddUser("owner");
        var course = AddCourse(owner.Id, "CS101");
        await _context.SaveChangesAsync();

        var result = await _service.LeaveAsync(course.Id, owner.Id);

        Assert.Equal(ServiceResultStatus.Invalid, result.Status);
        var ownerIsMember = await IsCourseMemberAsync(course.Id, owner.Id);
        Assert.True(ownerIsMember);
    }

    private User AddUser(string name) // 建立測試使用者，交由測試統一儲存。
    {
        var email = $"{name}@example.com";
        var user = new User
        {
            Id = Guid.NewGuid(),
            Name = name,
            Email = email
        };
        _context.Users.Add(user);
        return user;
    }

    private Course AddCourse(Guid ownerId, string code) // 建立測試課程與 Owner 成員，交由測試統一儲存。
    {
        var course = new Course
        {
            Name = "Computer Science",
            Code = code
        };
        _context.Courses.Add(course);
        AddCourseMember(course.Id, ownerId, CourseRole.Owner);
        return course;
    }

    private void AddCourseMember(Guid courseId, Guid userId, CourseRole role) // 建立指定角色的測試成員，交由測試統一儲存。
    {
        _context.CourseMembers.Add(new CourseMember
        {
            CourseId = courseId,
            UserId = userId,
            Role = role
        });
    }

    private Task<bool> IsCourseMemberAsync(Guid courseId, Guid userId) // 查詢成員資料是否存在，供測試確認操作結果。
        => _context.CourseMembers.AnyAsync(member => member.CourseId == courseId && member.UserId == userId);

    public void Dispose() // 釋放資料庫與連線，避免測試之間共用狀態。
    {
        _context.Dispose();
        _connection.Dispose();
    }
}

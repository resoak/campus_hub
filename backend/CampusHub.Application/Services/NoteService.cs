using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using CampusHub.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CampusHub.Application.Services;

public class NoteService : INoteService
{
    private readonly IApplicationDbContext _context;

    public NoteService(IApplicationDbContext context) => _context = context;

    public async Task<NoteDto> CreateAsync(Guid authorId, CreateNoteRequest request)
    {
        if (!await IsMemberAsync(request.CourseId, authorId))
            throw new UnauthorizedAccessException("非課程成員");
        var note = new Note { CourseId = request.CourseId, AuthorId = authorId, Title = request.Title, Content = request.Content };
        _context.Notes.Add(note);
        await _context.SaveChangesAsync();
        return ToDto(note);
    }

    public async Task<NoteDto?> GetByIdAsync(Guid id)
        => (await _context.Notes.FindAsync(id)) is { } n ? ToDto(n) : null;

    public async Task<NoteDto[]> GetByCourseAsync(Guid courseId)
        => await _context.Notes.Where(n => n.CourseId == courseId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => ToDto(n)).ToArrayAsync();

    public async Task<NoteDto?> UpdateAsync(Guid noteId, Guid userId, UpdateNoteRequest request)
    {
        var note = await _context.Notes.FindAsync(noteId);
        if (note == null || note.AuthorId != userId) return null;
        if (request.Title != null) note.Title = request.Title;
        if (request.Content != null) note.Content = request.Content;
        note.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return ToDto(note);
    }

    public async Task<bool> DeleteAsync(Guid noteId, Guid userId)
    {
        var note = await _context.Notes.FindAsync(noteId);
        if (note == null || note.AuthorId != userId) return false;
        _context.Notes.Remove(note);
        await _context.SaveChangesAsync();
        return true;
    }

    private Task<bool> IsMemberAsync(Guid courseId, Guid userId)
        => _context.CourseMembers.AnyAsync(m => m.CourseId == courseId && m.UserId == userId);

    private static NoteDto ToDto(Note n) => new()
    {
        Id = n.Id, CourseId = n.CourseId, AuthorId = n.AuthorId,
        Title = n.Title, Content = n.Content, CreatedAt = n.CreatedAt, UpdatedAt = n.UpdatedAt
    };
}

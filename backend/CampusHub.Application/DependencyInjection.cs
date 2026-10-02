using CampusHub.Application.Interfaces;
using CampusHub.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CampusHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ICourseService, CourseService>();
        services.AddScoped<INoteService, NoteService>();
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<ITaskService, TaskService>();

        return services;
    }
}

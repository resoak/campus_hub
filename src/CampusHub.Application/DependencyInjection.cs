using CampusHub.Application.Interfaces;
using CampusHub.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CampusHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IPostService, PostService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<ISearchService, SearchService>();

        return services;
    }
}
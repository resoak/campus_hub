using CampusHub.Application.Interfaces;
using CampusHub.Infrastructure.Data;
using CampusHub.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CampusHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<CampusHubDbContext>());

        return services;
    }
}
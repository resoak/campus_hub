namespace CampusHub.Application.Common;

public enum ServiceResultStatus
{
    Success,
    Invalid,
    Forbidden,
    NotFound,
    Conflict
}

public record ServiceResult(ServiceResultStatus Status, string? Error = null)
{
    public static ServiceResult Success() => new(ServiceResultStatus.Success);
    public static ServiceResult Invalid(string error) => new(ServiceResultStatus.Invalid, error);
    public static ServiceResult Forbidden() => new(ServiceResultStatus.Forbidden);
    public static ServiceResult NotFound(string error) => new(ServiceResultStatus.NotFound, error);
    public static ServiceResult Conflict(string error) => new(ServiceResultStatus.Conflict, error);
}

public record ServiceResult<T>(ServiceResultStatus Status, T? Value = default, string? Error = null)
{
    public static ServiceResult<T> Success(T value) => new(ServiceResultStatus.Success, value);
    public static ServiceResult<T> Invalid(string error) => new(ServiceResultStatus.Invalid, Error: error);
    public static ServiceResult<T> Forbidden() => new(ServiceResultStatus.Forbidden);
    public static ServiceResult<T> NotFound(string error) => new(ServiceResultStatus.NotFound, Error: error);
    public static ServiceResult<T> Conflict(string error) => new(ServiceResultStatus.Conflict, Error: error);
}

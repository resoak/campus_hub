namespace CampusHub.Domain.Enums;

public enum PostStatus
{
    Draft = 0,
    Published = 1,
    Archived = 2
}

public enum UserRole
{
    Student = 0,
    Admin = 1,
    Moderator = 2
}

public enum LikeTargetType
{
    Post = 0,
    Comment = 1
}

public enum SortBy
{
    Latest = 0,
    Popular = 1,
    Trending = 2
}
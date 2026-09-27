using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet("posts")]
    public async Task<ActionResult<PaginatedResponse<PostDto>>> SearchPosts(
        [FromQuery] string q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] Guid[]? tagIds = null,
        [FromQuery] string sortBy = "latest")
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "搜尋關鍵字不能為空" });
        }

        var request = new SearchRequest
        {
            Query = q,
            Page = page,
            PageSize = pageSize,
            CategoryId = categoryId,
            TagIds = tagIds,
            SortBy = sortBy,
        };

        var result = await _searchService.SearchPostsAsync(request);
        return Ok(result);
    }
}
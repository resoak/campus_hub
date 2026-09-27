using CampusHub.Application.DTOs;
using CampusHub.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CampusHub.Api.Controllers.Api;

[ApiController]
[Route("api/[controller]")]
public class TagsController : ControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<ActionResult<TagDto[]>> GetTags()
    {
        var tags = await _tagService.GetAllTagsAsync();
        return Ok(tags);
    }

    [HttpGet("popular")]
    public async Task<ActionResult<TagDto[]>> GetPopularTags([FromQuery] int limit = 20)
    {
        var tags = await _tagService.GetPopularTagsAsync(limit);
        return Ok(tags);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TagDto>> GetTag(Guid id)
    {
        var tag = await _tagService.GetTagByIdAsync(id);
        if (tag == null)
            return NotFound(new { message = "標籤不存在" });
        return Ok(tag);
    }

    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<TagDto>> GetTagBySlug(string slug)
    {
        var tag = await _tagService.GetTagBySlugAsync(slug);
        if (tag == null)
            return NotFound(new { message = "標籤不存在" });
        return Ok(tag);
    }
}
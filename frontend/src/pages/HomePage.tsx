import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { categoryService, tagService } from '../services/api';
import type { Category, Tag } from '../../types';
import { PostCard } from '../components/forum/PostCard';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Dropdown } from '../components/ui/Dropdown';
import { Loader2, ChevronDown, Filter, X } from 'lucide-react';
import { cn, formatNumber } from '../utils/helpers';

export function HomePage() {
  const { posts, pagination, filters, fetchPosts, setFilters, isLoading, error } = usePostStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Sync URL params with filters
  useEffect(() => {
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    const categoryId = searchParams.get('categoryId') || undefined;
    const tagIds = searchParams.get('tagIds')?.split(',').filter(Boolean) || undefined;
    const search = searchParams.get('q') || undefined;
    const sortBy = (searchParams.get('sort') as 'latest' | 'popular' | 'trending') || 'latest';

    setFilters({
      page,
      categoryId,
      tagIds,
      search,
      sortBy,
    });
  }, [searchParams, setFilters]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page && filters.page > 1) params.set('page', filters.page.toString());
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.tagIds?.length) params.set('tagIds', filters.tagIds.join(','));
    if (filters.search) params.set('q', filters.search);
    if (filters.sortBy && filters.sortBy !== 'latest') params.set('sort', filters.sortBy);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Load categories and tags
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [cats, tgs] = await Promise.all([categoryService.getCategories(), tagService.getTags()]);
        setCategories(cats);
        setTags(tgs);
      } catch (error) {
        console.error('Failed to load options:', error);
      }
    };
    loadOptions();
  }, []);

  const handleCategoryChange = (categoryId: string | undefined) => {
    setFilters({ categoryId, page: 1 });
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = filters.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter((t) => t !== tagId)
      : [...currentTags, tagId];
    setFilters({ tagIds: newTags, page: 1 });
  };

  const handleSearch = (query: string) => {
    setFilters({ search: query || undefined, page: 1 });
  };

  const handleSortChange = (sortBy: 'latest' | 'popular' | 'trending') => {
    setFilters({ sortBy });
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  const clearAllFilters = () => {
    setFilters({ categoryId: undefined, tagIds: [], search: undefined, page: 1 });
  };

  const hasActiveFilters = filters.categoryId || filters.tagIds?.length || filters.search;

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">最新文章</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {pagination ? `共 ${pagination.total} 篇文章` : '載入中...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="search"
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="搜尋文章..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-label="搜尋文章"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Sort Dropdown */}
          <Dropdown
            options={[
              { value: 'latest', label: '最新' },
              { value: 'popular', label: '最熱門' },
              { value: 'trending', label: '趨勢' },
            ]}
            value={filters.sortBy}
            onChange={handleSortChange}
            placeholder="排序"
          />

          {/* Filter Toggle */}
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-1.5" />
            篩選
            {hasActiveFilters && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">
                {((filters.tagIds?.length || 0) + (filters.categoryId ? 1 : 0) + (filters.search ? 1 : 0))}
              </span>
            )}
          </Button>

          <Link to="/posts/new">
            <Button size="sm">
              <svg className="h-4 w-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              發文
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="h-3.5 w-3.5 mr-1" />
            清除所有篩選
          </Button>
          {filters.categoryId && (
            <Badge variant="outline" onRemove={() => handleCategoryChange(undefined)} size="sm">
              {categories.find((c) => c.id === filters.categoryId)?.name || filters.categoryId}
            </Badge>
          )}
          {filters.tagIds?.map((tagId) => (
            <Badge key={tagId} variant="outline" onRemove={() => handleTagToggle(tagId)} size="sm">
              {tags.find((t) => t.id === tagId)?.name || tagId}
            </Badge>
          ))}
          {filters.search && (
            <Badge variant="outline" onRemove={() => handleSearch('')} size="sm">
              搜尋: {filters.search}
            </Badge>
          )}
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分類</label>
              <Dropdown
                options={[
                  { value: '', label: '所有分類' },
                  ...categories.map((c) => ({ value: c.id, label: c.name, color: c.color })),
                ]}
                value={filters.categoryId || ''}
                onChange={handleCategoryChange}
                placeholder="所有分類"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">標籤</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                      filters.tagIds?.includes(tag.id)
                        ? `bg-[${tag.color}]/20 text-[${tag.color}] border border-[${tag.color}]/30`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                    aria-pressed={filters.tagIds?.includes(tag.id)}
                  >
                    {tag.name}
                    <span className="ml-1.5 text-xs opacity-70">{formatNumber(tag.postCount)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Grid */}
      {isLoading && posts.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">找不到文章</h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">嘗試調整篩選條件或搜尋關鍵字</p>
          <Button variant="outline" onClick={clearAllFilters} className="mt-4">
            清除篩選
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-2" aria-label="分頁導航">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="上一頁"
              >
                <ChevronDown className="h-4 w-4 rotate-180" />
              </Button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    aria-label={`第 ${pageNum} 頁`}
                    aria-current={pagination.page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="下一頁"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </nav>
          )}
        </>
      )}

      {error && (
        <div className="text-center py-8 text-red-600 dark:text-red-400" role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => fetchPosts(filters)} className="mt-4">
            重試
          </Button>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { searchService } from '../services/api';
import { PostCard } from '../components/forum/PostCard';
import { Button } from '../components/ui/Button';
import { Loader2, Search, X, Filter, ChevronDown } from 'lucide-react';
import { cn, formatNumber } from '../utils/helpers';

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { posts, pagination, fetchPosts, setFilters, isLoading, error } = usePostStore();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    if (q) {
      setFilters({ search: q, page: 1 });
    }
  }, [searchParams, setFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const params = new URLSearchParams();
      params.set('q', query.trim());
      setSearchParams(params, { replace: true });
    }
  };

  const handlePageChange = (page: number) => {
    setFilters({ page });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {query ? `搜尋「{query}」的結果` : '搜尋文章'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {pagination
            ? `找到 {pagination.total} 篇相關文章`
            : query
            ? '搜尋中...'
            : '輸入關鍵字搜尋文章'}
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="輸入關鍵字搜尋標題、內容、作者..."
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="搜尋文章"
            autoFocus
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
        <Button type="submit" size="lg" className="whitespace-nowrap">
          <Search className="h-5 w-5 mr-2" />
          搜尋
        </Button>
      </form>

      {query && (
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
            搜尋關鍵字：「{query}」
          </span>
          <Button variant="ghost" size="sm" onClick={() => { setQuery(''); setSearchParams({}); }}>
            <X className="h-3.5 w-3.5 mr-1" />
            清除
          </Button>
        </div>
      )}

      {/* Results */}
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
          <Search className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            {query ? `找不到包含「{query}」的文章` : '輸入關鍵字開始搜尋'}
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            {query ? '嘗試使用不同的關鍵字或檢查拼字' : '搜尋標題、內容、作者、標籤'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

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
          <Button variant="outline" onClick={() => query && handleSearch(new Event('submit'))} className="mt-4">
            重試
          </Button>
        </div>
      )}
    </div>
  );
}
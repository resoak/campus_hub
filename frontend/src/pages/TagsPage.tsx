import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tagService } from '../services/api';
import type { Tag } from '../../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loader2, ChevronRight, Hash, Users, MessageSquare, Eye, Search } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import { cn } from '../utils/helpers';

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadTags = async () => {
      try {
        const [allTags, popTags] = await Promise.all([
          tagService.getTags(),
          tagService.getPopularTags(20),
        ]);
        setTags(allTags);
        setPopularTags(popTags);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入標籤失敗');
      } finally {
        setIsLoading(false);
      }
    };
    loadTags();
  }, []);

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">熱門標籤</h1>
          <p className="text-gray-500 dark:text-gray-400">探索熱門話題，發現更多精彩內容</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <Badge key={i} variant="outline" className="animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重試
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">熱門標籤</h1>
        <p className="text-gray-500 dark:text-gray-400">探索熱門話題，發現更多精彩內容</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋標籤..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="搜尋標籤"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Popular Tags Cloud */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Hash className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          熱門標籤
        </h2>
        <div className="flex flex-wrap gap-2">
          {popularTags.slice(0, 30).map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.slug}`}
              className="group"
            >
              <Badge
                variant="outline"
                size="md"
                className={cn(
                  'px-3 py-1.5 transition-all',
                  `border-[${tag.color}]/30 text-[${tag.color}] hover:bg-[${tag.color}]/10`
                )}
              >
                #{tag.name}
                <span className="ml-1.5 text-xs opacity-70">{formatNumber(tag.postCount)}</span>
              </Badge>
            </Link>
          ))}
        </div>
        {popularTags.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">暫無熱門標籤</p>
        )}
      </div>

      {/* All Tags */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          所有標籤 ({filteredTags.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {filteredTags.map((tag) => (
            <Link
              key={tag.id}
              to={`/tags/${tag.slug}`}
              className="group"
            >
              <Badge
                variant="outline"
                size="sm"
                className={cn(
                  'px-2.5 py-1 transition-all',
                  `border-[${tag.color}]/30 text-[${tag.color}] hover:bg-[${tag.color}]/10`
                )}
              >
                #{tag.name}
                <span className="ml-1.5 text-xs opacity-70">{formatNumber(tag.postCount)}</span>
              </Badge>
            </Link>
          ))}
        </div>
        {filteredTags.length === 0 && searchQuery && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">找不到符合的標籤</p>
        )}
      </div>
    </div>
  );
}
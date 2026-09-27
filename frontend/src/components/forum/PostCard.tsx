import { Link } from 'react-router-dom';
import { ThumbsUp, MessageSquare, Eye, Flag, Bookmark } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { formatDate, formatNumber } from '../../utils/helpers';
import type { Post } from '../../types';
import { cn } from '../../utils/helpers';

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'compact';
  showExcerpt?: boolean;
}

export function PostCard({ post, variant = 'default', showExcerpt = true }: PostCardProps) {
  const isPinned = post.isPinned;
  const isEssence = post.isEssence;

  return (
    <article className={cn('transition-shadow hover:shadow-md', variant === 'compact' ? 'p-4' : 'p-6')}>
      <Card variant="outlined" className={cn('h-full flex flex-col', isPinned && 'ring-2 ring-yellow-400/50')}>
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-4 mb-4">
            <Link to={`/users/${post.authorId}`} className="flex-shrink-0" aria-label={`查看 ${post.author.username} 的個人檔案`}>
              <Avatar src={post.author.avatarUrl} fallback={post.author.username} size="md" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Link to={`/users/${post.authorId}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  {post.author.username}
                </Link>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <time dateTime={post.createdAt} className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(post.createdAt)}
                </time>
                {isPinned && <Badge variant="warning" size="sm" dot>置頂</Badge>}
                {isEssence && <Badge variant="primary" size="sm" dot>精華</Badge>}
              </div>
              <Link to={`/categories/${post.category.slug}`} className="text-sm">
                <Badge variant="outline" className="text-xs" style={{ borderColor: post.category.color, color: post.category.color }}>
                  {post.category.name}
                </Badge>
              </Link>
            </div>
          </div>

          <Link to={`/posts/${post.id}`} className="group">
            <h3 className={cn(
              'font-semibold line-clamp-2 transition-colors mb-3',
              variant === 'compact' ? 'text-base' : 'text-lg',
              'text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
            )}>
              {post.title}
            </h3>

            {showExcerpt && post.excerpt && (
              <p className={cn(
                'text-gray-600 dark:text-gray-400 line-clamp-3 mb-4',
                variant === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {post.excerpt}
              </p>
            )}
          </Link>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4" aria-label="標籤">
              {post.tags.slice(0, 3).map((tag) => (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.slug}`}
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
              {post.tags.length > 3 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 px-2">+{post.tags.length - 3}</span>
              )}
            </div>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <button
                className={cn(
                  'flex items-center gap-1.5 transition-colors',
                  'hover:text-indigo-600 dark:hover:text-indigo-400'
                )}
                aria-label={`文章點讚數：${formatNumber(post.likeCount)}`}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{formatNumber(post.likeCount)}</span>
              </button>
              <Link
                to={`/posts/${post.id}`}
                className={cn('flex items-center gap-1.5 transition-colors', 'hover:text-indigo-600 dark:hover:text-indigo-400')}
                aria-label={`留言數：${formatNumber(post.commentCount)}`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{formatNumber(post.commentCount)}</span>
              </Link>
              <span className="flex items-center gap-1.5" aria-label={`瀏覽數：${formatNumber(post.viewCount)}`}>
                <Eye className="h-4 w-4" />
                <span>{formatNumber(post.viewCount)}</span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="分享文章">
                <Flag className="h-4 w-4" />
              </button>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors" aria-label="收藏文章">
                <Bookmark className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </article>
  );
}
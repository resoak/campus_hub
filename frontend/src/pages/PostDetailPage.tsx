import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePostStore } from '../store/postStore';
import { useAuthStore } from '../store/authStore';
import type { Post } from '../../types';
import { CommentThread } from '../components/forum/CommentThread';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { formatDate, formatNumber } from '../utils/helpers';
import { Loader2, Edit, Trash2, Flag, Share2, Bookmark, ThumbsUp, Eye, MessageSquare, ChevronLeft } from 'lucide-react';
import { cn } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { currentPost, fetchPost, fetchComments, likePost, unlikePost, deletePost, clearCurrentPost } = usePostStore();

  const [isDeleting, setIsDeleting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost(id);
      fetchComments(id);
    }
    return () => clearCurrentPost();
  }, [id, fetchPost, fetchComments, clearCurrentPost]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!currentPost) return;

    const wasLiked = liked;
    setLiked(!wasLiked);
    try {
      if (wasLiked) {
        await unlikePost(currentPost.id);
      } else {
        await likePost(currentPost.id);
      }
    } catch {
      setLiked(wasLiked);
    }
  };

  const handleDelete = async () => {
    if (!currentPost) return;
    if (!window.confirm('確定要刪除這篇文章嗎？此操作無法復原。')) return;

    setIsDeleting(true);
    try {
      await deletePost(currentPost.id);
      navigate('/');
    } catch (error) {
      console.error('Failed to delete post:', error);
      alert('刪除失敗，請稍後再試');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share && currentPost) {
      try {
        await navigator.share({
          title: currentPost.title,
          text: currentPost.excerpt,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else if (currentPost) {
      await navigator.clipboard.writeText(window.location.href);
      alert('連結已複製到剪貼簿');
    }
  };

  if (!currentPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-500 dark:text-gray-400">載入文章中...</p>
      </div>
    );
  }

  const post = currentPost;
  const isAuthor = user?.id === post.authorId;
  const canEdit = isAuthor || user?.role === 'admin' || user?.role === 'moderator';

  return (
    <article className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label="麵包屑">
        <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400">首頁</Link>
        <ChevronLeft className="h-4 w-4" />
        <Link to={`/categories/${post.category.slug}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
          {post.category.name}
        </Link>
        <ChevronLeft className="h-4 w-4" />
        <span className="text-gray-900 dark:text-white truncate max-w-[200px]" aria-current="page">{post.title}</span>
      </nav>

      {/* Post Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Link to={`/categories/${post.category.slug}`} className="text-sm">
            <Badge variant="outline" style={{ borderColor: post.category.color, color: post.category.color }}>
              {post.category.name}
            </Badge>
          </Link>
          {post.isPinned && <Badge variant="warning" size="sm" dot>置頂</Badge>}
          {post.isEssence && <Badge variant="primary" size="sm" dot>精華</Badge>}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <Link to={`/users/${post.authorId}`} className="flex items-center gap-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Avatar src={post.author.avatarUrl} fallback={post.author.username} size="sm" />
            <span className="font-medium text-gray-900 dark:text-white">{post.author.username}</span>
          </Link>
          <time dateTime={post.createdAt}>{formatDate(post.createdAt)}</time>
          {post.updatedAt !== post.createdAt && (
            <span>· 更新於 {formatDate(post.updatedAt)}</span>
          )}
          <span>· {formatNumber(post.viewCount)} 瀏覽</span>
        </div>

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4" aria-label="標籤">
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.slug}`}
                className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Post Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8">
          <ReactMarkdown components={{
            code: ({ children, ...props }) => (
              <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto"><code {...props}>{children}</code></pre>
            ),
          }}>
            {post.content}
          </ReactMarkdown>
        </div>
      </div>

      {/* Post Actions */}
      <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={cn(
              'flex items-center gap-2 text-sm font-medium transition-colors',
              liked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'
            )}
            aria-label={liked ? `取消點讚 (${formatNumber(post.likeCount)})` : `點讚 (${formatNumber(post.likeCount)})`}
            aria-pressed={liked}
          >
            <ThumbsUp className={cn('h-5 w-5', liked && 'fill-current')} />
            <span>{formatNumber(post.likeCount)}</span>
          </button>

          <Link to={`/posts/${post.id}#comments`} className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <MessageSquare className="h-5 w-5" />
            <span>{formatNumber(post.commentCount)}</span>
          </Link>

          <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400" aria-label={`瀏覽數：${formatNumber(post.viewCount)}`}>
            <Eye className="h-5 w-5" />
            <span>{formatNumber(post.viewCount)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="分享">
            <Share2 className="h-5 w-5" />
          </button>
          <button onClick={() => setBookmarked(!bookmarked)} className={cn('p-2 rounded-lg transition-colors', bookmarked ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20')} aria-label={bookmarked ? '取消收藏' : '收藏'}>
            <Bookmark className={cn('h-5 w-5', bookmarked && 'fill-current')} />
          </button>
          <button className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="舉報">
            <Flag className="h-5 w-5" />
          </button>

          {canEdit && (
            <>
              <Link to={`/posts/${post.id}/edit`} className="p-2 rounded-lg text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="編輯">
                <Edit className="h-5 w-5" />
              </Link>
              <button onClick={handleDelete} disabled={isDeleting} className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" aria-label="刪除">
                <Trash2 className="h-5 w-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Author Info */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-8">
        <Link to={`/users/${post.authorId}`} className="flex-shrink-0">
          <Avatar src={post.author.avatarUrl} fallback={post.author.username} size="lg" />
        </Link>
        <div className="flex-1">
          <Link to={`/users/${post.authorId}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
            {post.author.username}
          </Link>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">校園社群活躍成員</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/users/${post.authorId}`}>查看個人檔案</Link>
        </Button>
      </div>

      {/* Comments */}
      <CommentThread postId={post.id} />
    </article>
  );
}
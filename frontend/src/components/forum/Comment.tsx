import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, Reply, MoreHorizontal, Edit, Trash2, Flag } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { formatDate, formatNumber } from '../../utils/helpers';
import type { Comment } from '../../types';
import { cn } from '../../utils/helpers';

interface CommentProps {
  comment: Comment;
  depth?: number;
  onReply?: (comment: Comment) => void;
  onEdit?: (comment: Comment) => void;
  onDelete?: (commentId: string) => void;
  onLike?: (commentId: string) => void;
  onUnlike?: (commentId: string) => void;
  isLiked?: boolean;
  currentUserId?: string;
}

export function Comment({
  comment,
  depth = 0,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onUnlike,
  isLiked = false,
  currentUserId,
}: CommentProps) {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const isAuthor = currentUserId === comment.authorId;

  const handleSaveEdit = () => {
    if (editContent.trim() && editContent !== comment.content && onEdit) {
      onEdit(comment.id, editContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'relative',
        depth > 0 && 'ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-4'
      )}
      style={{ maxWidth: depth > 3 ? '100%' : undefined }}
    >
      <article className="py-4 flex gap-3">
        <Link to={`/users/${comment.authorId}`} className="flex-shrink-0" aria-label={`查看 ${comment.author.username} 的個人檔案`}>
          <Avatar src={comment.author.avatarUrl} fallback={comment.author.username} size="sm" />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={`/users/${comment.authorId}`}
              className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              {comment.author.username}
            </Link>
            <time dateTime={comment.createdAt} className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(comment.createdAt)}
            </time>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-400 dark:text-gray-500">(已編輯)</span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
                rows={3}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>儲存</Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>取消</Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
              <p className="whitespace-pre-wrap break-words">{comment.content}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => isLiked ? onUnlike?.(comment.id) : onLike?.(comment.id)}
              className={cn(
                'flex items-center gap-1.5 text-sm transition-colors',
                isLiked ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400'
              )}
              aria-label={isLiked ? `取消點讚 (${formatNumber(comment.likeCount)})` : `點讚 (${formatNumber(comment.likeCount)})`}
              aria-pressed={isLiked}
            >
              <ThumbsUp className={cn('h-4 w-4', isLiked && 'fill-current')} />
              <span>{formatNumber(comment.likeCount)}</span>
            </button>

            {onReply && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                aria-label="回覆"
              >
                <Reply className="h-4 w-4" />
                <span>回覆</span>
              </button>
            )}

            {isAuthor && (
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="更多選項"
                  aria-expanded={showActions}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {showActions && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 w-40 z-10">
                    <button
                      onClick={() => { onEdit?.(comment); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      編輯
                    </button>
                    <button
                      onClick={() => { onDelete?.(comment.id); setShowActions(false); }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      刪除
                    </button>
                    <hr className="my-1 border-gray-100 dark:border-gray-700" />
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                      <Flag className="h-4 w-4" />
                      舉報
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </article>

      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onUnlike={onUnlike}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
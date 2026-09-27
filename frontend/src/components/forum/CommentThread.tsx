import { useState, FormEvent } from 'react';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { Comment } from './Comment';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '../../utils/helpers';

interface CommentThreadProps {
  postId: string;
  initialComments?: import('../../types').Comment[];
}

export function CommentThread({ postId, initialComments }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { comments, fetchComments, createComment, likeComment, unlikeComment, updateComment, deleteComment } = usePostStore();

  const [replyingTo, setReplyingTo] = useState<import('../../types').Comment | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      await createComment({
        content: replyContent.trim(),
        postId,
        parentId: replyingTo?.id,
      });
      setReplyContent('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: import('../../types').Comment) => {
    setReplyingTo(comment);
    setReplyContent(`@${comment.author.username} `);
  };

  const handleLike = async (commentId: string) => {
    try {
      await likeComment(commentId);
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleUnlike = async (commentId: string) => {
    try {
      await unlikeComment(commentId);
    } catch (error) {
      console.error('Failed to unlike comment:', error);
    }
  };

  const handleEdit = async (commentId: string, content: string) => {
    try {
      await updateComment(commentId, content);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('確定要刪除這則留言嗎？')) return;
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  // We need liked state per comment - for now just track locally
  // In a real app, this would come from the API or be managed in store
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  return (
    <section className="mt-8" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <span>留言</span>
        <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({comments.length})</span>
      </h2>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-3">
            <Avatar src={user?.avatarUrl} fallback={user?.username} size="md" />
            <div className="flex-1">
              {replyingTo && (
                <div className="mb-2 p-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-indigo-700 dark:text-indigo-300 font-medium">回覆給</span>
                    <span className="font-medium text-gray-900 dark:text-white">{replyingTo.author.username}</span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      aria-label="取消回覆"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{replyingTo.content}</p>
                </div>
              )}
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={replyingTo ? `回覆 @${replyingTo.author.username}...` : '寫下你的想法...'}
                rows={3}
                className="mb-2"
                aria-label={replyingTo ? `回覆給 ${replyingTo.author.username}` : '留言內容'}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!replyContent.trim() || isSubmitting}
                  isLoading={isSubmitting}
                  className="min-w-[100px]"
                >
                  <Send className="h-4 w-4" />
                  {replyingTo ? '回覆' : '送出留言'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">登入後即可發表留言</p>
          <div className="flex justify-center gap-2">
            <Button asChild variant="primary" size="sm">
              <a href="/login">登入</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/register">註冊</a>
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4" role="list" aria-label="留言列表">
        {comments.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">還沒有留言</p>
            <p className="mt-1">搶先發表第一則留言吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
              onUnlike={handleUnlike}
              isLiked={likedComments.has(comment.id)}
              currentUserId={user?.id}
            />
          ))
        )}
      </div>
    </section>
  );
}
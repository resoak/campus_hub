import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePostStore } from '../store/postStore';
import { PostForm } from '../components/forum/PostForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { currentPost, fetchPost, clearCurrentPost } = usePostStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setAuthChecked(true));
  }, [checkAuth]);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
    return () => clearCurrentPost();
  }, [id, fetchPost, clearCurrentPost]);

  useEffect(() => {
    if (currentPost && authChecked) {
      const isAuthor = currentPost.authorId === useAuthStore.getState().user?.id;
      const userRole = useAuthStore.getState().user?.role;
      setCanEdit(isAuthor || userRole === 'admin' || userRole === 'moderator');
    }
  }, [currentPost, authChecked]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">請先登入</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">編輯文章需要登入帳號</p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link to="/login">登入</Link>
          </Button>
          <Button asChild variant="primary">
            <Link to="/register">註冊</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentPost) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="ml-4 text-gray-500 dark:text-gray-400">載入文章中...</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">無權限編輯</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">您沒有權限編輯這篇文章</p>
        <Button asChild variant="primary">
          <Link to={`/posts/${currentPost.id}`}>返回文章</Link>
        </Button>
      </div>
    );
  }

  const handleSuccess = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  const handleCancel = () => {
    navigate(`/posts/${currentPost.id}`);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/posts/${currentPost.id}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            返回文章
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">編輯文章</h1>
      </div>

      <PostForm
        initialData={{
          title: currentPost.title,
          content: currentPost.content,
          categoryId: currentPost.categoryId,
          tagIds: currentPost.tags.map((t) => t.id),
        }}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
        isEditing
        postId={currentPost.id}
      />
    </div>
  );
}
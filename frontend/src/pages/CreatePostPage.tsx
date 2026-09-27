import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { PostForm } from '../components/forum/PostForm';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export function CreatePostPage() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth().then(() => setAuthChecked(true));
  }, [checkAuth]);

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
        <p className="text-gray-500 dark:text-gray-400 mb-6">發文需要登入帳號</p>
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

  const handleSuccess = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  const handleCancel = () => {
    navigate('/');
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            返回首頁
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">發布新文章</h1>
      </div>

      <PostForm onSuccess={handleSuccess} onCancel={handleCancel} />
    </div>
  );
}
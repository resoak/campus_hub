import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './pages/HomePage';
import { PostDetailPage } from './pages/PostDetailPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { EditPostPage } from './pages/EditPostPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchPage } from './pages/SearchPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { TagsPage } from './pages/TagsPage';

function PublicLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();

  // In a real app, you'd want to check auth on mount
  // For now, we'll rely on the pages themselves to check auth

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<HomePage />} />
          <Route path="tags" element={<TagsPage />} />
          <Route path="tags/:slug" element={<HomePage />} />
          <Route path="posts/:id" element={<PostDetailPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        <Route path="/posts/new" element={
          <PublicLayout>
            <CreatePostPage />
          </PublicLayout>
        } />
        <Route path="/posts/:id/edit" element={
          <PublicLayout>
            <EditPostPage />
          </PublicLayout>
        } />

        {/* Protected routes - handled by page components */}
        <Route path="/profile" element={
          <PublicLayout>
            <div className="max-w-2xl mx-auto py-8 text-center">
              <h1 className="text-2xl font-bold">個人檔案</h1>
              <p className="mt-4 text-gray-500">功能開發中...</p>
            </div>
          </PublicLayout>
        } />
        <Route path="/my-posts" element={
          <PublicLayout>
            <div className="max-w-2xl mx-auto py-8 text-center">
              <h1 className="text-2xl font-bold">我的文章</h1>
              <p className="mt-4 text-gray-500">功能開發中...</p>
            </div>
          </PublicLayout>
        } />
        <Route path="/settings" element={
          <PublicLayout>
            <div className="max-w-2xl mx-auto py-8 text-center">
              <h1 className="text-2xl font-bold">設定</h1>
              <p className="mt-4 text-gray-500">功能開發中...</p>
            </div>
          </PublicLayout>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
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
import { CoursesPage } from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';

function PublicLayout() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl py-8 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-4 text-gray-500">功能開發中...</p>
    </div>
  );
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

          <Route element={<ProtectedRoute />}>
            <Route path="courses" element={<CoursesPage />} />
            <Route path="courses/:id" element={<CourseDetailPage />} />
            <Route path="posts/new" element={<CreatePostPage />} />
            <Route path="posts/:id/edit" element={<EditPostPage />} />
            <Route path="profile" element={<PlaceholderPage title="個人檔案" />} />
            <Route path="my-posts" element={<PlaceholderPage title="我的文章" />} />
            <Route path="settings" element={<PlaceholderPage title="設定" />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

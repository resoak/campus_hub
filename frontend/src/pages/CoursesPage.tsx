import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, DoorOpen, Loader2, Plus, Users } from 'lucide-react';
import { courseService } from '../services/api';
import type { Course } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || '操作失敗，請稍後再試。';
  }
  return error instanceof Error ? error.message : '操作失敗，請稍後再試。';
}

export function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadCourses = async () => {
    setIsLoading(true);
    setPageError(null);
    try { setCourses(await courseService.getMine()); }
    catch (error) { setPageError(getErrorMessage(error)); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { void loadCourses(); }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!name.trim() || !code.trim()) {
      setFormError('課程名稱與課程代碼不可空白。');
      return;
    }
    setIsCreating(true);
    try {
      const course = await courseService.create({ name: name.trim(), code: code.trim(), description: description.trim() || undefined });
      setName(''); setCode(''); setDescription(''); setCreateOpen(false);
      navigate(`/courses/${course.id}`);
    } catch (error) { setFormError(getErrorMessage(error)); }
    finally { setIsCreating(false); }
  };

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    if (!joinCode.trim()) { setFormError('請輸入課程代碼。'); return; }
    setIsJoining(true);
    try {
      await courseService.join({ code: joinCode.trim() });
      setJoinCode(''); setJoinOpen(false);
      await loadCourses();
    } catch (error) { setFormError(getErrorMessage(error)); }
    finally { setIsJoining(false); }
  };

  const openCreate = () => { setFormError(null); setJoinOpen(false); setCreateOpen((v) => !v); };
  const openJoin = () => { setFormError(null); setCreateOpen(false); setJoinOpen((v) => !v); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">我的課程</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">建立課程、加入課程，並管理課程成員。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openJoin}><DoorOpen className="h-4 w-4" />加入課程</Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" />建立課程</Button>
        </div>
      </div>

      {(createOpen || joinOpen) && (
        <Card variant="outlined">
          {createOpen ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">建立新課程</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">建立後你會自動成為 Owner。</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="課程名稱" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="例如：資料結構" />
                <Input label="課程代碼" value={code} onChange={(e) => setCode(e.target.value)} maxLength={50} placeholder="例如：CS101" />
              </div>
              <Textarea label="課程說明" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} placeholder="簡單介紹這門課程..." />
              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setCreateOpen(false)}>取消</Button>
                <Button type="submit" isLoading={isCreating}>建立</Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">加入課程</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">輸入課程代碼即可加入，預設角色為 Member。</p>
              </div>
              <Input label="課程代碼" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} maxLength={50} placeholder="例如：CS101" />
              {formError && <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setJoinOpen(false)}>取消</Button>
                <Button type="submit" isLoading={isJoining}>加入</Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {pageError && (
        <Card variant="outlined" className="border-red-200 dark:border-red-900">
          <p className="text-red-600 dark:text-red-400">{pageError}</p>
          <Button variant="outline" className="mt-3" onClick={() => void loadCourses()}>重新載入</Button>
        </Card>
      )}

      {isLoading ? (
        <div className="flex min-h-52 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : courses.length === 0 ? (
        <Card variant="outlined" className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">目前沒有課程</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">建立一門課程，或使用課程代碼加入。</p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link key={course.id} to={`/courses/${course.id}`} className="group">
              <Card variant="outlined" className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300"><BookOpen className="h-5 w-5" /></div>
                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">{course.code}</span>
                </div>
                <h2 className="mt-4 text-xl font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{course.name}</h2>
                <p className="mt-2 min-h-12 text-sm text-gray-500 dark:text-gray-400">{course.description || '尚未設定課程說明。'}</p>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400"><Users className="h-4 w-4" />查看課程與成員</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

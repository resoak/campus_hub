import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuthStore } from '../store/authStore';
import { userService } from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = name.trim();
    if (!value || value.length > 100) {
      setError('姓名必須為 1 到 100 個字元');
      setSaved(false);
      return;
    }
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const updated = await userService.updateMe(value);
      updateUser(updated);
      setName(updated.name);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <section className="mx-auto max-w-2xl py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">個人資料</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">查看帳號資訊並更新姓名。</p>
      <dl className="mt-6 grid gap-4 rounded-lg border border-gray-200 p-5 dark:border-gray-700">
        <div><dt className="text-sm text-gray-500">用戶名</dt><dd className="mt-1">{user.username}</dd></div>
        <div><dt className="text-sm text-gray-500">電子郵件</dt><dd className="mt-1">{user.email}</dd></div>
      </dl>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <Input label="姓名" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} autoComplete="name" />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {saved && <p role="status" className="text-sm text-green-600">個人資料已更新</p>}
        <Button type="submit" isLoading={loading}>儲存變更</Button>
      </form>
    </section>
  );
}

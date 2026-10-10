import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../store/authStore';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Loader2, Eye, EyeOff, Mail, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../utils/helpers';

const registerSchema = z.object({
  username: z.string().min(2, '用戶名至少需要 2 個字元').max(50, '用戶名最多 50 個字元').regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用戶名只能包含字母、數字、底線和中文'),
  name: z.string().trim().min(1, '請輸入姓名').max(100, '姓名最多 100 個字元'),
  email: z.string().email('請輸入有效的電子郵件'),
  password: z.string().min(8, '密碼至少需要 8 個字元').max(50, '密碼最多 50 個字元').regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, '密碼需包含大小寫字母及數字'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '兩次輸入的密碼不一致',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: '至少 8 個字元', test: (p: string) => p.length >= 8 && p.length <= 50 },
  { label: '包含大寫字母', test: (p: string) => /[A-Z]/.test(p) },
  { label: '包含小寫字母', test: (p: string) => /[a-z]/.test(p) },
  { label: '包含數字', test: (p: string) => /\d/.test(p) },
];

export function RegisterPage() {
  const { register: registerUser, isAuthenticated, checkAuth } = useAuthStore();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch('password');

  useEffect(() => {
    setPassword(watchedPassword || '');
  }, [watchedPassword]);

  useEffect(() => {
    checkAuth().then(() => {
      setAuthChecked(true);
      if (isAuthenticated) navigate('/');
    });
  }, [checkAuth, isAuthenticated, navigate]);

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setIsLoading(true);
    try {
      await registerUser(data.username, data.email, data.password, data.name);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '註冊失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">CampusHub</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">建立新帳號</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">加入校園社群，開始分享與交流</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm" role="alert">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {error}
          </div>
        )}

        <Input
          label="用戶名"
          placeholder="輸入用戶名"
          error={errors.username?.message}
          icon={<User className="h-5 w-5" />}
          {...register('username')}
          autoComplete="username"
          maxLength={50}
        />

        <Input
          label="姓名"
          placeholder="輸入姓名"
          error={errors.name?.message}
          {...register('name')}
          autoComplete="name"
          maxLength={100}
        />

        <Input
          label="電子郵件"
          type="email"
          placeholder="your@email.com"
          error={errors.email?.message}
          icon={<Mail className="h-5 w-5" />}
          {...register('email')}
          autoComplete="email"
        />

        <Input
          label="密碼"
          type={showPassword ? 'text' : 'password'}
          placeholder="輸入密碼"
          error={errors.password?.message}
          icon={<Lock className="h-5 w-5" />}
          {...register('password')}
          autoComplete="new-password"
          trailingIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          }
        />

        {password && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">密碼強度要求：</p>
            <div className="grid grid-cols-2 gap-1.5">
              {passwordRequirements.map((req) => {
                const met = req.test(password);
                return (
                  <div key={req.label} className="flex items-center gap-1.5 text-xs">
                    {met ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                    )}
                    <span className={cn(met ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500')}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <Input
          label="確認密碼"
          type={showPassword ? 'text' : 'password'}
          placeholder="再次輸入密碼"
          error={errors.confirmPassword?.message}
          icon={<Lock className="h-5 w-5" />}
          {...register('confirmPassword')}
          autoComplete="new-password"
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400">
            我同意{' '}
            <Link to="/terms" className="text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400">服務條款</Link>
            {' '}與{' '}
            <Link to="/privacy" className="text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400">隱私權政策</Link>
          </label>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          <Loader2 className="h-4 w-4" />
          建立帳號
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
        已經有帳號？{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-400 font-medium">
          立即登入
        </Link>
      </p>
    </div>
  );
}
import { useState, FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePostStore } from '../../store/postStore';
import { useAuthStore } from '../../store/authStore';
import { categoryService, tagService } from '../../services/api';
import type { Category, Tag } from '../../types';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { MultiSelect } from '../ui/MultiSelect';
import { Dropdown } from '../ui/Dropdown';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '../../utils/helpers';

const postSchema = z.object({
  title: z.string().min(5, '標題至少需要 5 個字元').max(100, '標題最多 100 個字元'),
  content: z.string().min(20, '內容至少需要 20 個字元').max(10000, '內容最多 10,000 個字元'),
  categoryId: z.string().min(1, '請選擇分類'),
  tagIds: z.array(z.string()).max(5, '最多選擇 5 個標籤'),
});

type PostFormData = z.infer<typeof postSchema>;

interface PostFormProps {
  initialData?: Partial<PostFormData>;
  onSuccess?: (postId: string) => void;
  onCancel?: () => void;
  isEditing?: boolean;
  postId?: string;
}

export function PostForm({ initialData, onSuccess, onCancel, isEditing = false, postId }: PostFormProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { createPost, updatePost, isCreating, isUpdating } = usePostStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: '',
      content: '',
      categoryId: '',
      tagIds: [],
      ...initialData,
    },
  });

  const selectedCategoryId = watch('categoryId');
  const selectedTagIds = watch('tagIds');

  // Load categories and tags on mount
  const loadOptions = async () => {
    try {
      const [cats, tgs] = await Promise.all([categoryService.getCategories(), tagService.getTags()]);
      setCategories(cats);
      setTags(tgs);
    } catch (error) {
      console.error('Failed to load categories/tags:', error);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  // Load options once
  const [optionsLoaded, setOptionsLoaded] = useState(false);
  if (!optionsLoaded) {
    loadOptions();
    setOptionsLoaded(true);
  }

  const onSubmit = async (data: PostFormData) => {
    if (!isAuthenticated) {
      setSubmitError('請先登入');
      return;
    }

    setSubmitError(null);

    try {
      let result;
      if (isEditing && postId) {
        result = await updatePost(postId, data);
      } else {
        result = await createPost(data);
      }
      onSuccess?.(result.id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : isEditing ? '更新失敗' : '發文失敗';
      setSubmitError(message);
    }
  };

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color,
  }));

  const tagOptions = tags.map((t) => ({
    value: t.id,
    label: t.name,
    color: t.color,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {submitError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300" role="alert">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{submitError}</p>
        </div>
      )}

      <div>
        <Input
          label="標題"
          placeholder="輸入文章標題 (5-100 字元)"
          error={errors.title?.message}
          {...register('title')}
          autoComplete="off"
          maxLength={100}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分類</label>
        {isLoadingOptions ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <Dropdown
            options={categoryOptions}
            value={selectedCategoryId}
            onChange={(value) => setValue('categoryId', value)}
            placeholder="選擇分類"
            disabled={isSubmitting}
            className={errors.categoryId ? 'border-red-500 focus:ring-red-500' : ''}
          />
        )}
        {errors.categoryId && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{errors.categoryId.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">標籤 (最多 5 個)</label>
        {isLoadingOptions ? (
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ) : (
          <MultiSelect
            options={tagOptions}
            value={selectedTagIds}
            onChange={setValue('tagIds')}
            placeholder="選擇標籤 (可多選)"
            disabled={isSubmitting}
            maxSelected={5}
            searchable
          />
        )}
        {errors.tagIds && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{errors.tagIds.message}</p>
        )}
      </div>

      <div>
        <Textarea
          label="內容"
          placeholder="分享你的想法... (支援 Markdown)"
          error={errors.content?.message}
          helperText="支援 Markdown 語法，最多 10,000 字元"
          {...register('content')}
          rows={15}
          maxLength={10000}
        />
        {errors.content && (
          <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">{errors.content.message}</p>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            取消
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting || isCreating || isUpdating} className="min-w-[140px]">
          <Loader2 className="h-4 w-4" />
          {isEditing ? '更新文章' : '發布文章'}
        </Button>
      </div>
    </form>
  );
}
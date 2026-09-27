import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/api';
import type { Category } from '../../types';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Loader2, ChevronRight, Hash, Users, MessageSquare, Eye } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import { cn } from '../utils/helpers';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入分類失敗');
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} variant="outlined" className="animate-pulse p-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mt-2" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重試
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">分類瀏覽</h1>
        <p className="text-gray-500 dark:text-gray-400">探索不同主題的文章，找到你感興趣的內容</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/categories/${category.slug}`}
            className="group"
          >
            <Card variant="outlined" className="p-6 h-full transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700">
              <div className="flex items-start gap-4">
                <div className={cn(
                  'h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110',
                  `bg-[${category.color}]/15`
                )}>
                  <MessageSquare className={cn('h-6 w-6', `text-[${category.color}]`)} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Hash className="h-4 w-4" />
                    {formatNumber(category.postCount)} 文章
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
              </div>
            </Card>
          </Link>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Hash className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">尚無分類</h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">管理員可以在後台建立分類</p>
          </div>
        )}
      </div>
    </div>
  );
}
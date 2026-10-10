export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'student' | 'admin' | 'moderator';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  postCount: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
  postCount: number;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  authorId: string;
  author: User;
  categoryId: string;
  category: Category;
  tags: Tag[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isPinned: boolean;
  isEssence: boolean;
  status: 'published' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  author: User;
  parentId?: string;
  replies?: Comment[];
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Like {
  id: string;
  userId: string;
  targetType: 'post' | 'comment';
  targetId: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PostFilters {
  page?: number;
  pageSize?: number;
  categoryId?: string;
  tagIds?: string[];
  search?: string;
  authorId?: string;
  sortBy?: 'latest' | 'popular' | 'trending';
}

export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: string;
  tagIds: string[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {}

export interface CreateCommentRequest {
  content: string;
  postId: string;
  parentId?: string;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  email: string;
  password: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string | null;
}

export type CourseRole = 'Owner' | 'TA' | 'Member';

export interface CourseMember {
  userId: string;
  name: string;
  email: string;
  role: CourseRole;
  joinedAt: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
}
export interface JoinCourseRequest {
  code: string;
}

export interface AddCourseMemberRequest {
  userId: string;
  role: 'TA' | 'Member';
}

export interface UpdateCourseMemberRoleRequest {
  role: 'TA' | 'Member';
}

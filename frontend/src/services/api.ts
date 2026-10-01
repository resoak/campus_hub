/**
 * HTTP 客戶端 — 封裝 axios，自動處理 token 附加與 401 刷新
 */
import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
import type { ApiError, AuthTokens, LoginRequest, RegisterRequest } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:7001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let accessToken: string | null = null;
let refreshTokenPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshTokenPromise) {
          refreshTokenPromise = refreshAccessToken();
        }
        const newAccessToken = await refreshTokenPromise;
        refreshTokenPromise = null;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return api(originalRequest);
      } catch {
        refreshTokenPromise = null;
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

const refreshAccessToken = async (): Promise<string> => {
  const response = await axios.post<AuthTokens>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const { accessToken: newToken } = response.data;
  setAccessToken(newToken);
  return newToken;
};

const clearAuth = () => {
  setAccessToken(null);
  localStorage.removeItem('user');
};

export const authService = {
  login: async (data: LoginRequest) => {
    const response = await api.post<AuthTokens & { user: import('../types').User }>('/auth/login', data);
    setAccessToken(response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await api.post<AuthTokens & { user: import('../types').User }>('/auth/register', data);
    setAccessToken(response.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    clearAuth();
  },

  getCurrentUser: async () => {
    const response = await api.get<import('../types').User>('/auth/me');
    localStorage.setItem('user', JSON.stringify(response.data));
    return response.data;
  },
};

export const postService = {
  getPosts: async (params?: import('../types').PostFilters) => {
    const response = await api.get<import('../types').PaginatedResponse<import('../types').Post>>('/posts', { params });
    return response.data;
  },

  getPost: async (id: string) => {
    const response = await api.get<import('../types').Post>(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data: import('../types').CreatePostRequest) => {
    const response = await api.post<import('../types').Post>('/posts', data);
    return response.data;
  },

  updatePost: async (id: string, data: import('../types').UpdatePostRequest) => {
    const response = await api.put<import('../types').Post>(`/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: string) => {
    await api.delete(`/posts/${id}`);
  },

  likePost: async (id: string) => {
    const response = await api.post<{ likeCount: number; isLiked: boolean }>(`/posts/${id}/like`);
    return response.data;
  },

  unlikePost: async (id: string) => {
    const response = await api.delete<{ likeCount: number; isLiked: boolean }>(`/posts/${id}/like`);
    return response.data;
  },
};

export const commentService = {
  getComments: async (postId: string) => {
    const response = await api.get<import('../types').Comment[]>(`/posts/${postId}/comments`);
    return response.data;
  },

  createComment: async (data: import('../types').CreateCommentRequest) => {
    const response = await api.post<import('../types').Comment>('/comments', data);
    return response.data;
  },

  updateComment: async (id: string, content: string) => {
    const response = await api.put<import('../types').Comment>(`/comments/${id}`, { content });
    return response.data;
  },

  deleteComment: async (id: string) => {
    await api.delete(`/comments/${id}`);
  },

  likeComment: async (id: string) => {
    const response = await api.post<{ likeCount: number; isLiked: boolean }>(`/comments/${id}/like`);
    return response.data;
  },

  unlikeComment: async (id: string) => {
    const response = await api.delete<{ likeCount: number; isLiked: boolean }>(`/comments/${id}/like`);
    return response.data;
  },
};

export const categoryService = {
  getCategories: async () => {
    const response = await api.get<import('../types').Category[]>('/categories');
    return response.data;
  },

  getCategory: async (id: string) => {
    const response = await api.get<import('../types').Category>(`/categories/${id}`);
    return response.data;
  },
};

export const tagService = {
  getTags: async () => {
    const response = await api.get<import('../types').Tag[]>('/tags');
    return response.data;
  },

  getPopularTags: async (limit = 10) => {
    const response = await api.get<import('../types').Tag[]>(`/tags/popular?limit=${limit}`);
    return response.data;
  },
};

export const searchService = {
  searchPosts: async (query: string, filters?: import('../types').PostFilters) => {
    const response = await api.get<import('../types').PaginatedResponse<import('../types').Post>>('/search/posts', {
      params: { q: query, ...filters },
    });
    return response.data;
  },
};

export default api;
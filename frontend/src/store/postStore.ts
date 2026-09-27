import { create } from 'zustand';
import type { Post, PostFilters, PaginatedResponse, Comment } from '../types';
import { postService, commentService } from '../services/api';

interface PostState {
  posts: Post[];
  currentPost: Post | null;
  comments: Comment[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } | null;
  filters: PostFilters;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  fetchPosts: (filters?: PostFilters, append?: boolean) => Promise<void>;
  fetchPost: (id: string) => Promise<void>;
  createPost: (data: { title: string; content: string; categoryId: string; tagIds: string[] }) => Promise<Post>;
  updatePost: (id: string, data: Partial<{ title: string; content: string; categoryId: string; tagIds: string[] }>) => Promise<Post>;
  deletePost: (id: string) => Promise<void>;
  likePost: (id: string) => Promise<void>;
  unlikePost: (id: string) => Promise<void>;
  fetchComments: (postId: string) => Promise<void>;
  createComment: (data: { content: string; postId: string; parentId?: string }) => Promise<Comment>;
  updateComment: (id: string, content: string) => Promise<Comment>;
  deleteComment: (id: string) => Promise<void>;
  likeComment: (id: string) => Promise<void>;
  unlikeComment: (id: string) => Promise<void>;
  setFilters: (filters: Partial<PostFilters>) => void;
  clearError: () => void;
  clearCurrentPost: () => void;
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  currentPost: null,
  comments: [],
  pagination: null,
  filters: {
    page: 1,
    pageSize: 10,
    sortBy: 'latest',
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,

  fetchPosts: async (filters, append = false) => {
    set({ isLoading: true, error: null });
    try {
      const mergedFilters = { ...get().filters, ...filters, page: filters?.page || 1 };
      const response = await postService.getPosts(mergedFilters);
      set({
        posts: append ? [...get().posts, ...response.data] : response.data,
        pagination: {
          total: response.total,
          page: response.page,
          pageSize: response.pageSize,
          totalPages: response.totalPages,
        },
        filters: mergedFilters,
        isLoading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '載入文章失敗';
      set({ error: message, isLoading: false });
    }
  },

  fetchPost: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const post = await postService.getPost(id);
      set({ currentPost: post, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '載入文章詳情失敗';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createPost: async (data) => {
    set({ isCreating: true, error: null });
    try {
      const post = await postService.createPost(data);
      set((state) => ({
        posts: [post, ...state.posts],
        pagination: state.pagination ? { ...state.pagination, total: state.pagination.total + 1 } : null,
        isCreating: false,
      }));
      return post;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '發文失敗';
      set({ error: message, isCreating: false });
      throw error;
    }
  },

  updatePost: async (id, data) => {
    set({ isUpdating: true, error: null });
    try {
      const post = await postService.updatePost(id, data);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? post : p)),
        currentPost: state.currentPost?.id === id ? post : state.currentPost,
        isUpdating: false,
      }));
      return post;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新文章失敗';
      set({ error: message, isUpdating: false });
      throw error;
    }
  },

  deletePost: async (id: string) => {
    set({ error: null });
    try {
      await postService.deletePost(id);
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
        pagination: state.pagination ? { ...state.pagination, total: state.pagination.total - 1 } : null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '刪除文章失敗';
      set({ error: message });
      throw error;
    }
  },

  likePost: async (id: string) => {
    try {
      const { likeCount } = await postService.likePost(id);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, likeCount } : p)),
        currentPost: state.currentPost?.id === id ? { ...state.currentPost, likeCount } : state.currentPost,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '點讚失敗';
      set({ error: message });
      throw error;
    }
  },

  unlikePost: async (id: string) => {
    try {
      const { likeCount } = await postService.unlikePost(id);
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? { ...p, likeCount } : p)),
        currentPost: state.currentPost?.id === id ? { ...state.currentPost, likeCount } : state.currentPost,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '取消點讚失敗';
      set({ error: message });
      throw error;
    }
  },

  fetchComments: async (postId: string) => {
    try {
      const comments = await commentService.getComments(postId);
      set({ comments });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '載入留言失敗';
      set({ error: message });
    }
  },

  createComment: async (data) => {
    try {
      const comment = await commentService.createComment(data);
      set((state) => ({
        comments: [...state.comments, comment],
        currentPost: state.currentPost
          ? { ...state.currentPost, commentCount: state.currentPost.commentCount + 1 }
          : null,
      }));
      return comment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '留言失敗';
      set({ error: message });
      throw error;
    }
  },

  updateComment: async (id: string, content: string) => {
    try {
      const comment = await commentService.updateComment(id, content);
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? comment : c)),
      }));
      return comment;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '更新留言失敗';
      set({ error: message });
      throw error;
    }
  },

  deleteComment: async (id: string) => {
    try {
      await commentService.deleteComment(id);
      set((state) => ({
        comments: state.comments.filter((c) => c.id !== id),
        currentPost: state.currentPost
          ? { ...state.currentPost, commentCount: state.currentPost.commentCount - 1 }
          : null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '刪除留言失敗';
      set({ error: message });
      throw error;
    }
  },

  likeComment: async (id: string) => {
    try {
      const { likeCount } = await commentService.likeComment(id);
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? { ...c, likeCount } : c)),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '點讚失敗';
      set({ error: message });
      throw error;
    }
  },

  unlikeComment: async (id: string) => {
    try {
      const { likeCount } = await commentService.unlikeComment(id);
      set((state) => ({
        comments: state.comments.map((c) => (c.id === id ? { ...c, likeCount } : c)),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '取消點讚失敗';
      set({ error: message });
      throw error;
    }
  },

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  clearError: () => set({ error: null }),

  clearCurrentPost: () => set({ currentPost: null, comments: [] }),
}));
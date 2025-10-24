import { z } from 'zod';

// Users Schema
export const userEntitySchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(255),
  email: z.string().email(),
  password_hash: z.string().min(1),
  full_name: z.string().nullable(),
  profile_image_url: z.string().nullable().uri(),
  created_at: z.coerce.date()
});

export const createUserInputSchema = z.object({
  username: z.string().min(1).max(255),
  email: z.string().email(),
  password_hash: z.string().min(1),
  full_name: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().uri().optional(),
});

export const updateUserInputSchema = z.object({
  id: z.string(),
  username: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  password_hash: z.string().min(1).optional(),
  full_name: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().uri().optional(),
});

export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['username', 'email', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Posts Schema
export const postEntitySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1).max(255),
  content: z.string().nullable(),
  image_url: z.string().nullable().uri(),
  created_at: z.coerce.date()
});

export const createPostInputSchema = z.object({
  user_id: z.string(),
  title: z.string().min(1).max(255),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().uri().optional(),
});

export const updatePostInputSchema = z.object({
  id: z.string(),
  user_id: z.string().optional(),
  title: z.string().min(1).max(255).optional(),
  content: z.string().nullable().optional(),
  image_url: z.string().nullable().uri().optional(),
});

export const searchPostInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['title', 'created_at', 'user_id']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Comments Schema
export const commentEntitySchema = z.object({
  id: z.string(),
  user_id: z.string(),
  post_id: z.string(),
  content: z.string().min(1),
  created_at: z.coerce.date()
});

export const createCommentInputSchema = z.object({
  user_id: z.string(),
  post_id: z.string(),
  content: z.string().min(1),
});

export const updateCommentInputSchema = z.object({
  id: z.string(),
  content: z.string().min(1).optional(),
});

export const searchCommentInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['content', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Likes Schema
export const likeEntitySchema = z.object({
  user_id: z.string(),
  post_id: z.string().nullable(),
  comment_id: z.string().nullable(),
});

export const createLikeInputSchema = z.object({
  user_id: z.string(),
  post_id: z.string().nullable(),
  comment_id: z.string().nullable(),
}).refine(
  (data) => (data.post_id!== null)!== (data.comment_id!== null),
  { message: 'Must provide exactly one of post_id or comment_id' }
);

export const updateLikeInputSchema = z.object({
  user_id: z.string(),
  post_id: z.string().nullable().optional(),
  comment_id: z.string().nullable().optional(),
}).refine(
  (data) => (data.post_id!== null)!== (data.comment_id!== null),
  { message: 'Must provide exactly one of post_id or comment_id' }
);

export const searchLikeInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['user_id', 'post_id', 'comment_id']).default('user_id'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Inferred Types
export type User = z.infer<typeof userEntitySchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

export type Post = z.infer<typeof postEntitySchema>;
export type CreatePostInput = z.infer<typeof createPostInputSchema>;
export type UpdatePostInput = z.infer<typeof updatePostInputSchema>;
export type SearchPostInput = z.infer<typeof searchPostInputSchema>;

export type Comment = z.infer<typeof commentEntitySchema>;
export type CreateCommentInput = z.infer<typeof createCommentInputSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentInputSchema>;
export type SearchCommentInput = z.infer<typeof searchCommentInputSchema>;

export type Like = z.infer<typeof likeEntitySchema>;
export type CreateLikeInput = z.infer<typeof createLikeInputSchema>;
export type UpdateLikeInput = z.infer<typeof updateLikeInputSchema>;
export type SearchLikeInput = z.infer<typeof searchLikeInputSchema>;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/main';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { z } from 'zod';

// Type definitions
interface Thread {
  id: string;
  title: string;
  author: {
    id: string;
    username: string;
  };
  content: string;
  upvotes: number;
  comments: Array<{
    id: string;
    author: {
      id: string;
      username: string;
    };
    content: string;
  }>;
}

interface ForumThreadResponse {
  id: string;
  title: string;
  user_id: string;
  author_username: string;
  content: string;
  vote_count: number;
  comments: Array<{
    id: string;
    user_id: string;
    author_username: string;
    content: string;
  }>;
}

// Schema for thread creation
const CreateThreadSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(1),
});

type CreateThreadInput = z.infer<typeof CreateThreadSchema>;

const UV_Forum: React.FC = () => {
  // Authentication check
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/'); // Redirect to login
    }
  }, [currentUser, navigate]);

  // Query for forum threads
  const { data: threadsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['forum_threads'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/forum_threads`,
        {
          headers: {
            Authorization: `Bearer ${useAppStore(state => state.authentication_state.auth_token)}`,
          },
        }
      );
      
      // Transform response to match expected schema
      return response.data.data.map((thread: ForumThreadResponse) => ({
        id: thread.id,
        title: thread.title,
        author: {
          id: thread.user_id,
          username: thread.author_username,
        },
        content: thread.content,
        upvotes: thread.vote_count,
        comments: thread.comments.map(c => ({
          id: c.id,
          author: {
            id: c.user_id,
            username: c.author_username,
          },
          content: c.content,
        })),
      }));
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  // Mutation for creating new thread
  const createThreadMutation = useMutation({
    mutationFn: (newThread: CreateThreadInput) => {
      return axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/forum_threads`,
        newThread,
        {
          headers: {
            Authorization: `Bearer ${useAppStore(state => state.authentication_state.auth_token)}`,
            'Content-Type': 'application/json',
          },
        }
      );
    },
    onSuccess: () => {
      refetch(); // Refresh threads after creation
      setNewThreadTitle('');
      setContent('');
    },
  });

  // Local state for new thread form
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    try {
      // Validate input using Zod schema
      const result = CreateThreadSchema.safeParse({ title: newThreadTitle, content });
      if (!result.success) {
        setFormError(result.error.issues[0].message);
        return;
      }
      
      // Create new thread
      await createThreadMutation.mutate({ title: newThreadTitle, content });
    } catch (error: any) {
      setFormError(error.message || 'Failed to create thread');
    }
  };

  // Handle upvoting a thread
  const handleUpvote = (threadId: string) => {
    // This would typically involve an API call to update vote count
    // For demo purposes, we'll just update the local state
    // In a real app, you'd use a mutation to update the server
    // and then refetch the data
  };

  // Handle comment submission (simplified example)
  const handleCommentSubmit = (threadId: string, commentContent: string) => {
    // This would involve an API call to create a comment
    // For demo purposes, we'll just log the action
    console.log(`Submitting comment to thread ${threadId}:`, commentContent);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading Forum...</h1>
          <div className="mt-4">
            <svg className="animate-spin h-6 w-6 text-blue-500" role="status" aria-hidden="true">
              <circle className="cx" cx="3" cy="3" r="3" stroke="currentColor" strokeWidth="1.5"></circle>
            </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Forum</h2>
            <p className="text-gray-600 mb-4">{error instanceof Error? error.message : 'Unknown error'}</p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Thread List */}
          <div className="md:col-span-3">
            <div className="space-y-6">
              {threadsData?.map(thread => (
                <article key={thread.id} className="bg-white shadow-lg border border-gray-100 rounded-xl p-6">
                  <header className="border-b border-gray-200 pb-4 mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      <Link to={`/forum/threads/${thread.id}`} className="text-blue-600 hover:underline">
                        {thread.title}
                      </Link>
                    </h3>
                    <div className="text-sm text-gray-600">
                      By <Link to={`/profile/${thread.author.id}`} className="text-blue-600 hover:underline">
                        {thread.author.username}
                      </Link> • {new Date(thread.created_at).toLocaleDateString()}
                    </div>
                  </header>
                  
                  <div className="text-gray-700 mb-4">
                    {thread.content}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleUpvote(thread.id)}
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6.75 12.75 9H15l-2.25 1.65h-.75l-2.25 1.65H6m6.75-.75l-4.5 4.5M6.75-.75l-4.5 4.5M12 18l2-2V6a3 3 0 00-3-3m0 0a3 3 0 003 3v6m0-6a3 3 0 003 3m0 0v6" />
                      </svg>
                      <span>{thread.upvotes}</span>
                    </button>
                    
                    <button
                      className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-8-4H5a4 4 0 000 4v2z" />
                      </svg>
                      <span>{thread.comments.length} Comments</span>
                    </button>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {thread.comments.map(comment => (
                      <div key={comment.id} className="border border-gray-200 p-3 rounded-md">
                        <div className="text-sm text-gray-600">
                          <strong>{comment.author.username}</strong> • {new Date(comment.created_at).toLocaleDateString()}
                        </div>
                        <p className="mt-1 text-gray-800">{comment.content}</p>
                      </div>
                    ))}
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <textarea
                        placeholder="Write a comment..."
                        rows={3}
                        className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => handleCommentSubmit(thread.id, 'Sample comment')}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Post Comment
                      </button>
                    </div>
                  </div>
                </article>
              ))}
              
              {/* Empty state */}
              {!threadsData?.length && (
                <div className="bg-white shadow-lg border border-gray-100 rounded-xl p-8 text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">No threads found</h2>
                  <p className="text-gray-600">Be the first to start a discussion!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* New Thread Form */}
          <div className="md:col-span-1">
            <div className="bg-white shadow-lg border border-gray-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Start a New Thread</h2>
              
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4" aria-live="polite">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Enter thread title"
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    placeholder="What's on your mind?"
                    className="relative w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  />
                </textarea>
                </div>
                
                <button
                  type="submit"
                  disabled={createThreadMutation.isPending}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createThreadMutation.isPending? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Thread...
                    </span>
                  ) : (
                    'Create Thread'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UV_Forum;
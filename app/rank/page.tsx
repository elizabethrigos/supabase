"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getTimeAgo } from "../utils/time";
import { supabase } from "../utils/client";

export interface Post {
  id: number | string;
  user: {
    username: string;
    avatar: string;
  };
  image_url: string;
  caption: string;
  likes: number;
  isLiked: boolean;
  created_at: Date;
  updated_at?: Date;
}

const fallbackAvatar = "https://i.pravatar.cc/150?img=1";

function normalizePost(rawPost: any): Post {
  const nestedUser = rawPost?.user && typeof rawPost.user === "object" ? rawPost.user : null;

  return {
    id: rawPost?.id,
    user: {
      username: nestedUser?.username ?? "Elizabeth",
      avatar: nestedUser?.avatar ?? fallbackAvatar,
    },
    image_url: rawPost?.image_url ?? rawPost?.imageUrl ?? rawPost?.image ?? "",
    caption: rawPost?.caption ?? "",
    likes: Number(rawPost?.likes ?? 0),
    isLiked: Boolean(rawPost?.isLiked ?? rawPost?.is_liked ?? false),
    created_at: rawPost?.created_at ? new Date(rawPost.created_at) : new Date(),
    updated_at: rawPost?.updated_at ? new Date(rawPost.updated_at) : undefined,
  };
}

function HeartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6 text-red-500"
    >
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

function Modal({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card-bg rounded-xl overflow-hidden max-w-lg w-full shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Cerrar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header con usuario */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-primary">
            <Image
              src={post.user.avatar}
              alt={post.user.username}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">{post.user.username}</span>
            <span className="text-xs text-foreground/50">{getTimeAgo(post.created_at)}</span>
          </div>
        </div>

        {/* Imagen */}
        <div className="relative w-full aspect-square">
          <Image
            src={post.image_url}
            alt={`Post de ${post.user.username}`}
            fill
            className="object-cover"
          />
        </div>

        {/* Likes y caption */}
        <div className="p-4">
          <div className="flex items-center gap-2">
            <HeartIcon />
            <span className="text-lg font-bold text-foreground">
              {post.likes.toLocaleString("es-ES")} likes
            </span>
          </div>
          <p className="mt-2 text-foreground">
            <span className="font-semibold">{post.user.username}</span>{" "}
            <span className="text-foreground/80">{post.caption}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RankPage() {
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from('posts_new').select('*');
      if (error) {
        console.error('Error fetching posts:', error.message, error.code);
        console.error('Full error:', JSON.stringify(error, null, 2));
      } else {
        console.log('Data fetched:', data);
        const normalized = (data ?? []).map(normalizePost).filter((p) => p.image_url && p.user.avatar);
        setPosts(normalized);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Ranking
          </h1>
        </div>
      </header>

      {/* Grid de posts */}
      <main className="max-w-2xl mx-auto p-2">
        <div className="grid grid-cols-3 gap-1">
          {[...posts].sort((a, b) => b.likes - a.likes).map((post) => (
            <button
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square overflow-hidden group"
            >
              <Image
                src={post.image_url}
                alt={`Post con ${post.likes} likes`}
                fill
                className="object-cover transition-transform group-hover:scale-105"
              />
              {/* Overlay con likes al hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <HeartIcon />
                <span className="text-white font-semibold">
                  {post.likes.toLocaleString("es-ES")}
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Modal */}
      {selectedPost && (
        <Modal post={selectedPost} onClose={() => setSelectedPost(null)} />
      )}
    </div>
  );
}

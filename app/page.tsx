"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { getTimeAgo } from "./utils/time";
import { supabase } from "./utils/client";

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

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-7 h-7 text-red-500"
      >
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
      />
    </svg>
  );
}

function PostCard({ post, onLike }: { post: Post; onLike: (id: number | string) => void }) {
  return (
    <article className="bg-card-bg border border-border rounded-xl overflow-hidden shadow-sm">

      <div className="flex items-center gap-3 p-4">
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


      <div className="relative w-full aspect-square">
        <Image
          src={post.image_url}
          alt={`Post de ${post.user.username}`}
          fill
          className="object-cover"
        />
      </div>

   
      <div className="p-4">
   
        <div className="flex items-center gap-2">
          <button
            onClick={() => onLike(post.id)}
            className="hover:scale-110 transition-transform active:scale-95"
            aria-label={post.isLiked ? "Quitar like" : "Dar like"}
          >
            <HeartIcon filled={post.isLiked} />
          </button>
          <span className="font-semibold text-foreground">
            {post.likes.toLocaleString("es-ES")} likes
          </span>
        </div>

     
        <p className="mt-2 text-foreground">
          <span className="font-semibold">{post.user.username}</span>{" "}
          <span className="text-foreground/80">{post.caption}</span>
        </p>
      </div>
    </article>
  );
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  const handleLike = (postId: number | string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };


  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase.from('posts_new').select('*');
      if (error) {
        console.error('Error fetching posts:', error);
      } else {
        const normalizedPosts = (data ?? [])
          .map(normalizePost)
          .filter((post) => post.image_url && post.user.avatar);

        setPosts(normalizedPosts);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
  
      <header className="sticky top-0 z-50 bg-card-bg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-2xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Silphy por siempre
          </h1>
        </div>
      </header>


      <main className="max-w-lg mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} onLike={handleLike} />
          ))}
        </div>
      </main>
    </div>
  );
}

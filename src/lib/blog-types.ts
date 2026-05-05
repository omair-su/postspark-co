export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  published_at: string | null;
  reading_time_minutes: number | null;
  author: { name: string; slug: string; avatar_url: string | null } | null;
  category: { name: string; slug: string } | null;
};

export type BlogPostFull = BlogPostListItem & {
  content_md: string;
  meta_title: string | null;
  meta_description: string | null;
  author: { name: string; slug: string; avatar_url: string | null; bio: string | null; twitter_handle: string | null; linkedin_url: string | null } | null;
};

export type BlogCategory = { id: string; slug: string; name: string; description: string | null };
export type BlogAuthor = { id: string; slug: string; name: string; bio: string | null; avatar_url: string | null; twitter_handle: string | null; linkedin_url: string | null };

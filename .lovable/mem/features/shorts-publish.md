---
name: Shorts Studio publishing
description: Upload recorded video to storage, save to History, publish to YouTube via OAuth, TikTok via intent-open
type: feature
---
Bucket: `shorts-videos` (private, RLS owner = first folder segment = user_id).
Tables: extends `social_accounts` (youtube tokens) and `scheduled_posts` (+media_url, media_type, tool, repurpose_job_id).
YouTube: full per-user OAuth at `/api/public/oauth/youtube/callback`. Requires GOOGLE_OAUTH_CLIENT_ID/SECRET and registered redirect URI `https://postspark.co/api/public/oauth/youtube/callback` (plus preview). Scopes: youtube.upload, youtube.readonly. Resumable upload to Data API v3.
TikTok: connector only has read scopes (no video.publish). Intent-flow only: copies caption+hashtags, opens tiktok.com/tiktokstudio/upload, records draft in scheduled_posts. Full publish blocked on TikTok app review.
Video saved to repurpose_jobs.outputs.video so it appears in History.

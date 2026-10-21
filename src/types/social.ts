/**
 * Social models. These mirror the Postgres schema in
 * supabase/migrations/0001_social.sql so the local demo service and the
 * real backend share one shape.
 */
import type { Fit, Formality, ID, Pattern, StyleTag } from './models';

export type Audience = 'public' | 'followers' | 'private';

export interface Profile {
  id: ID;
  username: string; // unique, lowercase
  displayName: string;
  bio?: string;
  avatarUri?: string;
  /** Avatar fallback color when there's no photo. */
  avatarColor?: string;
  styleTags: StyleTag[]; // only the ones the user chose to show publicly
  isPrivate: boolean;
  createdAt: string;
  /** True for seeded demo accounts. Shown with a "Demo" badge. */
  demo?: boolean;
}

/**
 * A garment tagged in a post. Disclosure is opt-in per field: only what the
 * poster chose to share is stored on the post. Never a link to the private
 * wardrobe record.
 */
export interface PostItemTag {
  categoryId: string;
  primaryColor: string;
  secondaryColors?: string[];
  pattern?: Pattern;
  fit?: Fit;
  styleTags?: StyleTag[];
  formality?: Formality;
  warmth?: number;
  brand?: string;
  productName?: string;
}

export interface Post {
  id: ID;
  authorId: ID;
  /** Local file/data URIs (demo) or storage paths (backend). Up to 4. */
  images: string[];
  caption: string;
  styleTags: StyleTag[];
  items: PostItemTag[];
  audience: Audience;
  commentsDisabled: boolean;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  demo?: boolean;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  parentId?: ID; // one level of replies
  body: string;
  createdAt: string;
}

export interface Collection {
  id: ID;
  name: string;
  postIds: ID[];
  createdAt: string;
}

export type NotificationKind = 'follow' | 'followRequest' | 'followAccepted' | 'like' | 'comment' | 'reply';

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  actorId: ID;
  postId?: ID;
  commentId?: ID;
  createdAt: string;
  read: boolean;
}

export type ReportTarget = 'post' | 'comment' | 'account';
export type ReportReason = 'spam' | 'harassment' | 'nudity' | 'hate' | 'selfHarm' | 'minorSafety' | 'other';

export interface Report {
  id: ID;
  target: ReportTarget;
  targetId: ID;
  reason: ReportReason;
  note?: string;
  reporterId: ID;
  createdAt: string;
  status: 'open' | 'actioned' | 'dismissed';
}

export interface FeedPage {
  posts: Post[];
  nextCursor?: string;
}

export interface NotificationPrefs {
  follows: boolean;
  likes: boolean;
  comments: boolean;
}

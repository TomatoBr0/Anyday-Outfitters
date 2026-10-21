import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';
import { Button, EmptyState, NavHeader, TextField } from '@/components/ui';
import { Avatar, PostCard, promptReport, requireProfile, timeAgo } from '@/features/social/components';
import { ME, profileById, useSocial, visiblePosts } from '@/state/social';
import { useTheme } from '@/theme/ThemeProvider';
import { space } from '@/theme/tokens';
import type { Comment } from '@/types/social';

const PAGE = 20;

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const social = useSocial();
  const post = useMemo(() => visiblePosts(social).find((p) => p.id === id), [social, id]);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | undefined>();
  const [limit, setLimit] = useState(PAGE);

  const blocked = new Set(social.blocks.filter(([a]) => a === ME).map(([, b]) => b));
  const comments = social.comments.filter((c) => c.postId === id && !blocked.has(c.authorId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const top = comments.filter((c) => !c.parentId);
  const replies = (cid: string) => comments.filter((c) => c.parentId === cid);

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
        <NavHeader onBack={() => router.back()} />
        <EmptyState icon="info" title="Post unavailable" body="It was deleted, or you don’t have access to it." />
      </View>
    );
  }

  const send = () => {
    if (!requireProfile()) return;
    const c = social.addComment(post.id, text, replyTo?.id);
    if (c) {
      setText('');
      setReplyTo(undefined);
    }
  };

  const CommentRow = ({ c, nested }: { c: Comment; nested?: boolean }) => {
    const author = profileById(social, c.authorId);
    const canDelete = c.authorId === ME || post.authorId === ME;
    return (
      <View style={{ flexDirection: 'row', gap: space.sm, paddingVertical: space.sm, marginLeft: nested ? 44 : 0 }}>
        <Avatar profile={author} size={nested ? 26 : 32} />
        <View style={{ flex: 1 }}>
          <Text variant="body">
            <Text variant="bodyStrong">{author?.username ?? 'deleted'} </Text>
            {c.body}
          </Text>
          <View style={{ flexDirection: 'row', gap: space.lg, marginTop: 2 }}>
            <Text variant="caption" color="textSubtle">
              {timeAgo(c.createdAt)}
            </Text>
            {!nested && !post.commentsDisabled && (
              <Pressable onPress={() => setReplyTo(c)} hitSlop={8} accessibilityRole="button">
                <Text variant="caption" color="textMuted">
                  Reply
                </Text>
              </Pressable>
            )}
            {canDelete ? (
              <Pressable
                onPress={() => Alert.alert('Delete comment?', undefined, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => social.deleteComment(c.id) }])}
                hitSlop={8}
                accessibilityRole="button"
              >
                <Text variant="caption" color="textMuted">
                  Delete
                </Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => promptReport('comment', c.id)} hitSlop={8} accessibilityRole="button">
                <Text variant="caption" color="textMuted">
                  Report
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <NavHeader title="Post" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <PostCard post={post} />
        <Text variant="heading" style={{ marginTop: space.xl, marginBottom: space.sm }}>
          Comments
        </Text>
        {post.commentsDisabled && (
          <Text variant="caption" color="textMuted">
            Comments are turned off for this post.
          </Text>
        )}
        {top.length === 0 && !post.commentsDisabled && (
          <Text variant="caption" color="textMuted">
            No comments yet.
          </Text>
        )}
        {top.slice(0, limit).map((c) => (
          <View key={c.id}>
            <CommentRow c={c} />
            {replies(c.id).map((r) => (
              <CommentRow key={r.id} c={r} nested />
            ))}
          </View>
        ))}
        {top.length > limit && <Button label="More comments" variant="ghost" size="sm" onPress={() => setLimit(limit + PAGE)} />}
      </ScrollView>
      {!post.commentsDisabled && (
        <View style={{ padding: space.md, paddingBottom: Math.max(insets.bottom, space.md), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background }}>
          {replyTo && (
            <Pressable onPress={() => setReplyTo(undefined)} accessibilityRole="button" style={{ marginBottom: 6 }}>
              <Text variant="caption" color="textMuted">
                Replying to @{profileById(social, replyTo.authorId)?.username} · tap to cancel
              </Text>
            </Pressable>
          )}
          <View style={{ flexDirection: 'row', gap: space.sm, alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TextField placeholder="Add a comment…" value={text} onChangeText={setText} maxLength={500} returnKeyType="send" onSubmitEditing={send} />
            </View>
            <Button label="Post" size="sm" disabled={!text.trim()} onPress={send} style={{ minHeight: 48 }} />
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

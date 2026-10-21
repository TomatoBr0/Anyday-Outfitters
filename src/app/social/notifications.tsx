import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { Button, Card, EmptyState, NavHeader, Screen, SectionHeader } from '@/components/ui';
import { Avatar, timeAgo } from '@/features/social/components';
import { ME, profileById, useSocial } from '@/state/social';
import { space } from '@/theme/tokens';
import type { AppNotification } from '@/types/social';

const TEXT: Record<AppNotification['kind'], string> = {
  follow: 'started following you',
  followRequest: 'requested to follow you',
  followAccepted: 'accepted your follow request',
  like: 'liked your post',
  comment: 'commented on your post',
  reply: 'replied to your comment',
};
const PREF: Record<AppNotification['kind'], 'follows' | 'likes' | 'comments'> = {
  follow: 'follows',
  followRequest: 'follows',
  followAccepted: 'follows',
  like: 'likes',
  comment: 'comments',
  reply: 'comments',
};

export default function Notifications() {
  const social = useSocial();
  const requests = social.requests.filter(([, t]) => t === ME).map(([f]) => f);
  const list = social.notifications.filter((n) => social.notificationPrefs[PREF[n.kind]]);

  useEffect(() => {
    useSocial.getState().markNotificationsRead();
  }, []);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Activity" onBack={() => router.back()} />}>
      {requests.length > 0 && (
        <>
          <SectionHeader title="Follow requests" style={{ marginTop: space.sm }} />
          {requests.map((id) => {
            const p = profileById(social, id);
            return (
              <Card key={id} style={{ marginBottom: space.sm, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Avatar profile={p} />
                <Text variant="bodyStrong" style={{ flex: 1 }}>
                  @{p?.username}
                </Text>
                <Button label="Accept" size="sm" onPress={() => social.respondToRequest(id, true)} />
                <Button label="Decline" size="sm" variant="secondary" onPress={() => social.respondToRequest(id, false)} />
              </Card>
            );
          })}
        </>
      )}
      {list.length === 0 && requests.length === 0 ? (
        <EmptyState icon="bell" title="No activity yet" body="When people follow you, like or comment on your outfits, you’ll see it here." />
      ) : (
        list.map((n) => {
          const p = profileById(social, n.actorId);
          return (
            <Pressable
              key={n.id}
              onPress={() => router.push(n.postId ? { pathname: '/social/post/[id]', params: { id: n.postId } } : { pathname: '/social/user/[id]', params: { id: n.actorId } })}
              accessibilityRole="button"
              style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md }}
            >
              <Avatar profile={p} />
              <View style={{ flex: 1 }}>
                <Text variant="body">
                  <Text variant="bodyStrong">@{p?.username ?? 'someone'} </Text>
                  {TEXT[n.kind]}
                </Text>
                <Text variant="caption" color="textSubtle">
                  {timeAgo(n.createdAt)}
                </Text>
              </View>
            </Pressable>
          );
        })
      )}
      <Text variant="caption" color="textSubtle" style={{ marginTop: space.xl }}>
        Push notifications aren’t enabled yet. Manage which activity shows here in Social settings.
      </Text>
    </Screen>
  );
}

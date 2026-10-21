import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { Button, EmptyState, NavHeader, Screen } from '@/components/ui';
import { Avatar, FollowButton } from '@/features/social/components';
import { ME, profileById, useSocial } from '@/state/social';
import { space } from '@/theme/tokens';

type List = 'followers' | 'following' | 'requests' | 'blocked';
const TITLES: Record<List, string> = { followers: 'Followers', following: 'Following', requests: 'Follow requests', blocked: 'Blocked accounts' };

export default function Connections() {
  const { id = ME, list = 'followers' } = useLocalSearchParams<{ id?: string; list?: List }>();
  const social = useSocial();
  const ids =
    list === 'followers'
      ? social.follows.filter(([, t]) => t === id).map(([f]) => f)
      : list === 'following'
        ? social.follows.filter(([f]) => f === id).map(([, t]) => t)
        : list === 'requests'
          ? social.requests.filter(([, t]) => t === ME).map(([f]) => f)
          : social.blocks.filter(([a]) => a === ME).map(([, b]) => b);

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title={TITLES[list]} onBack={() => router.back()} />}>
      {ids.length === 0 && <EmptyState icon="people" title="Nobody here" body={list === 'blocked' ? 'You haven’t blocked anyone.' : 'This list is empty.'} />}
      {ids.map((uid) => {
        const p = profileById(social, uid);
        if (!p) return null;
        return (
          <View key={uid} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.sm }}>
            <Pressable disabled={list === 'blocked'} onPress={() => router.push({ pathname: '/social/user/[id]', params: { id: uid } })} accessibilityRole="button" style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Avatar profile={p} size={44} />
              <View>
                <Text variant="bodyStrong">{p.displayName}</Text>
                <Text variant="caption" color="textMuted">
                  @{p.username}
                </Text>
              </View>
            </Pressable>
            {list === 'requests' && (
              <>
                <Button label="Accept" size="sm" onPress={() => social.respondToRequest(uid, true)} />
                <Button label="Decline" size="sm" variant="secondary" onPress={() => social.respondToRequest(uid, false)} />
              </>
            )}
            {list === 'blocked' && <Button label="Unblock" size="sm" variant="secondary" onPress={() => social.unblock(uid)} />}
            {list === 'followers' && id === ME && <Button label="Remove" size="sm" variant="secondary" onPress={() => social.removeFollower(uid)} />}
            {(list === 'following' || (list === 'followers' && id !== ME)) && uid !== ME && <FollowButton id={uid} />}
          </View>
        );
      })}
    </Screen>
  );
}

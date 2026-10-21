import { router } from 'expo-router';
import { Alert } from 'react-native';

import { Text } from '@/components/Text';
import { Card, ListRow, NavHeader, Screen, SectionHeader, ToggleRow } from '@/components/ui';
import { ME, useSocial } from '@/state/social';
import { space } from '@/theme/tokens';

export default function SocialSettings() {
  const social = useSocial();
  const me = social.profiles.find((p) => p.id === ME);
  const blocked = social.blocks.filter(([a]) => a === ME).length;
  const openReports = social.reports.filter((r) => r.status === 'open').length;

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Social settings" onBack={() => router.back()} />}>
      <SectionHeader title="Privacy" style={{ marginTop: space.sm }} />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        {me ? (
          <ToggleRow first title="Private account" subtitle="Approve followers before they see your posts" value={me.isPrivate} onChange={(v) => social.updateProfile({ isPrivate: v })} />
        ) : (
          <ListRow first title="Create a profile" onPress={() => router.push('/social/edit-profile')} />
        )}
        <ListRow title="Follow requests" value={String(social.requests.filter(([, t]) => t === ME).length)} onPress={() => router.push({ pathname: '/social/connections', params: { list: 'requests' } })} />
        <ListRow title="Blocked accounts" value={String(blocked)} onPress={() => router.push({ pathname: '/social/connections', params: { list: 'blocked' } })} />
      </Card>

      <SectionHeader title="Activity shown" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ToggleRow first title="New followers & requests" value={social.notificationPrefs.follows} onChange={(v) => social.setNotificationPrefs({ follows: v })} />
        <ToggleRow title="Likes" value={social.notificationPrefs.likes} onChange={(v) => social.setNotificationPrefs({ likes: v })} />
        <ToggleRow title="Comments & replies" value={social.notificationPrefs.comments} onChange={(v) => social.setNotificationPrefs({ comments: v })} />
      </Card>

      <SectionHeader title="Community" />
      <Card padded={false} style={{ paddingHorizontal: space.lg }}>
        <ToggleRow first title="Show demo content" subtitle="Sample accounts and posts, labeled “Demo”" value={social.showDemo} onChange={social.setShowDemo} />
        <ListRow title="Community Guidelines" onPress={() => router.push('/social/guidelines')} />
        <ListRow title="Moderation queue" subtitle="Reports you’ve filed (demo of the admin tool)" value={String(openReports)} onPress={() => router.push('/social/moderation')} />
        <ListRow
          destructive
          title="Delete social profile & posts"
          subtitle="Your wardrobe is not affected"
          onPress={() =>
            Alert.alert('Delete your social data?', 'Your profile, posts, comments, likes and saves are removed. Your closet stays.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await social.resetSocial();
                  router.back();
                },
              },
            ])
          }
        />
      </Card>
      <Text variant="caption" color="textSubtle" style={{ marginTop: space.lg }}>
        Demo mode: social data is stored on this phone only. When the shared backend is enabled, these settings are enforced on the server.
      </Text>
    </Screen>
  );
}

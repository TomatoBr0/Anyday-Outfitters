/**
 * Moderation queue (prototype of the admin dashboard). In demo mode it lists
 * reports filed on this device. In production this screen is restricted to
 * accounts with the `moderator` role, enforced by RLS on the reports table.
 */
import { router } from 'expo-router';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { Badge, Button, Card, EmptyState, NavHeader, Screen } from '@/components/ui';
import { timeAgo } from '@/features/social/components';
import { useSocial } from '@/state/social';
import { space } from '@/theme/tokens';

export default function Moderation() {
  const social = useSocial();
  const target = (r: (typeof social.reports)[number]) => {
    if (r.target === 'post') return social.posts.find((p) => p.id === r.targetId)?.caption ?? '(deleted post)';
    if (r.target === 'comment') return social.comments.find((c) => c.id === r.targetId)?.body ?? '(deleted comment)';
    return `@${social.profiles.find((p) => p.id === r.targetId)?.username ?? 'unknown'}`;
  };

  return (
    <Screen edges={['top', 'bottom']} header={<NavHeader title="Moderation queue" onBack={() => router.back()} />}>
      <Text variant="caption" color="textMuted">
        Prototype. In production, only moderators see this queue; actions remove content and can suspend accounts, and reporters are told the outcome.
      </Text>
      {social.reports.length === 0 && <EmptyState icon="flag" title="No reports" body="Reports from the ••• menu on posts, comments and profiles appear here." />}
      {social.reports.map((r) => (
        <Card key={r.id} style={{ marginTop: space.md, gap: space.sm }}>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Badge label={r.target} />
            <Badge label={r.reason} tone="warning" />
            <Text variant="caption" color="textSubtle" style={{ flex: 1, textAlign: 'right' }}>
              {timeAgo(r.createdAt)} · {r.status}
            </Text>
          </View>
          <Text variant="body" numberOfLines={3}>
            {target(r)}
          </Text>
          {r.status === 'open' && (
            <View style={{ flexDirection: 'row', gap: space.sm }}>
              <Button
                label="Remove content"
                size="sm"
                variant="danger"
                onPress={() => {
                  // Demo: hide by blocking the author for this viewer. Production: soft-delete + audit log.
                  const authorId = r.target === 'post' ? social.posts.find((p) => p.id === r.targetId)?.authorId : r.target === 'comment' ? social.comments.find((c) => c.id === r.targetId)?.authorId : r.targetId;
                  if (authorId && authorId !== 'me') social.block(authorId);
                  social.resolveReport(r.id, 'actioned');
                }}
              />
              <Button label="Dismiss" size="sm" variant="secondary" onPress={() => social.resolveReport(r.id, 'dismissed')} />
            </View>
          )}
        </Card>
      ))}
    </Screen>
  );
}

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const scheme = useColorScheme() ?? 'light';
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Status bar */}
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="small" themeColor="textSecondary">Network</ThemedText>
            <ThemedText type="small">Checking…</ThemedText>
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="small" themeColor="textSecondary">Nearby relay</ThemedText>
            <ThemedText type="small">Idle — tap Relay tab to start</ThemedText>
          </ThemedView>

          {/* SOS button */}
          <View style={styles.sosContainer}>
            <Pressable
              style={({ pressed }) => [styles.sosButton, pressed && styles.sosPressed]}
              onPress={() => {/* TODO: navigate to sos/confirm */}}
              accessibilityRole="button"
              accessibilityLabel="Send SOS — hold for 3 seconds">
              <ThemedText style={styles.sosLabel}>SOS</ThemedText>
              <ThemedText style={styles.sosHint}>Hold 3 s to send</ThemedText>
            </Pressable>
          </View>

          {/* Queue status */}
          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="small" themeColor="textSecondary">Queued alerts</ThemedText>
            <ThemedText type="small">0</ThemedText>
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>
            ResilienceSOS is an experimental supplemental communication path, not a certified
            life-safety system.
          </ThemedText>

        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  sosContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#E53935',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  sosPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  sosLabel: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: 2,
  },
  sosHint: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 4,
  },
  disclaimer: {
    textAlign: 'center',
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
});

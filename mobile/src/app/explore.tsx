import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="small">{value}</ThemedText>
    </View>
  );
}

export default function RelayScreen() {
  const [relayEnabled, setRelayEnabled] = useState(false);

  return (
    <ThemedView style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>

          {/* Relay toggle */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.toggleRow}>
              <View>
                <ThemedText type="default">Relay mode</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {relayEnabled ? 'Advertising and discovering' : 'Off'}
                </ThemedText>
              </View>
              <Switch
                value={relayEnabled}
                onValueChange={setRelayEnabled}
                trackColor={{ true: '#E53935' }}
                accessibilityLabel="Enable relay mode"
              />
            </View>
          </ThemedView>

          {/* Diagnostics */}
          <ThemedText type="subtitle" style={styles.sectionTitle}>Diagnostics</ThemedText>

          <ThemedView type="backgroundElement" style={styles.card}>
            <StatusRow label="Bluetooth" value="Unknown — requires dev build" />
            <View style={styles.divider} />
            <StatusRow label="Location permission" value="Unknown" />
            <View style={styles.divider} />
            <StatusRow label="Nearby module" value="Requires dev build" />
            <View style={styles.divider} />
            <StatusRow label="Connected peers" value="0" />
            <View style={styles.divider} />
            <StatusRow label="Backend reachable" value="Unknown" />
          </ThemedView>

          <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
            Nearby Connections requires a development build (not Expo Go). Run{' '}
            <ThemedText type="code">npx expo run:android</ThemedText> after{' '}
            <ThemedText type="code">npx expo prebuild</ThemedText>.
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
  },
  card: {
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginHorizontal: Spacing.three,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    marginTop: Spacing.two,
  },
  note: {
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
  },
});

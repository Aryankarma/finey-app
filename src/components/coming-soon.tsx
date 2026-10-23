import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, space, type } from '@/ui/theme';

// Stand-in for tab screens that are not built yet.
export function ComingSoon({ title }: { title: string }) {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.body}>This screen is next on the list.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { height: layout.headerHeight, justifyContent: 'center', paddingHorizontal: space.screenX },
  title: { ...type.screenTitle, color: colors.text },
  body: { ...type.bodyRegular, color: colors.textFaint, paddingHorizontal: space.screenX },
});

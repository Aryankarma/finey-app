import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { MonthChip } from '@/components/month-chip';
import { ViewTabs } from '@/components/view-tabs';
import { colors, layout, space, type } from '@/ui/theme';

export function SpendingHeader({ view, month }: { view: 'breakdown' | 'trends'; month: string }) {
  const router = useRouter();
  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title} role="heading">Spending</Text>
        <MonthChip label={month} />
      </View>
      <ViewTabs
        label="Spending view"
        tabs={[
          { key: 'breakdown', label: 'Breakdown' },
          { key: 'trends', label: 'Trends' },
        ]}
        value={view}
        onChange={(v) => router.replace(v === 'breakdown' ? '/spending' : '/spending/trends')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    height: layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.screenX,
  },
  title: { ...type.screenTitle, color: colors.text },
});

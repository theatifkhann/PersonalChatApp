import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { COLORS } from "../../constants/theme";

export default function AppShell({ children, footer }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>{children}</View>
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: COLORS.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

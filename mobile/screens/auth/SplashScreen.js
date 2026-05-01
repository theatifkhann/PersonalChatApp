import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, SHADOW } from "../../constants/theme";

export default function SplashScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <View style={styles.logo}>
        <Text style={styles.logoIcon}>C</Text>
      </View>
      <Text style={styles.title}>Chat App</Text>
      <Text style={styles.subtitle}>Private conversations, cleanly organized.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    backgroundColor: COLORS.background,
    flex: 1,
    justifyContent: "center",
    padding: 28,
  },
  glow: {
    backgroundColor: "rgba(34,197,94,0.16)",
    borderRadius: 140,
    height: 280,
    position: "absolute",
    width: 280,
  },
  logo: {
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 26,
    height: 78,
    justifyContent: "center",
    width: 78,
    ...SHADOW,
  },
  logoIcon: {
    color: "#03110A",
    fontSize: 34,
    fontWeight: "900",
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
    marginTop: 22,
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },
});

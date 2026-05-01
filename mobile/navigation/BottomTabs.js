import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS, SHADOW } from "../constants/theme";

const TABS = [
  { key: "chats", label: "Chats", icon: "C" },
  { key: "discover", label: "Discover", icon: "D" },
  { key: "friends", label: "Friends", icon: "F" },
  { key: "profile", label: "Profile", icon: "P" },
];

export default function BottomTabs({ activeTab, onChangeTab }) {
  return (
    <View style={styles.wrap}>
      {TABS.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <Pressable
            accessibilityRole="tab"
            key={tab.key}
            onPress={() => onChangeTab(tab.key)}
            style={[styles.item, active ? styles.itemActive : null]}
          >
            <Text style={[styles.icon, active ? styles.iconActive : null]}>{tab.icon}</Text>
            <Text style={[styles.label, active ? styles.labelActive : null]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    backgroundColor: "rgba(17,24,39,0.92)",
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    bottom: 12,
    flexDirection: "row",
    gap: 4,
    left: 14,
    padding: 6,
    position: "absolute",
    right: 14,
    ...SHADOW,
  },
  item: {
    alignItems: "center",
    borderRadius: RADIUS.lg,
    flex: 1,
    gap: 3,
    minHeight: 56,
    justifyContent: "center",
  },
  itemActive: {
    backgroundColor: "rgba(34,197,94,0.12)",
  },
  icon: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "900",
  },
  iconActive: {
    color: COLORS.primary,
  },
  label: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },
  labelActive: {
    color: COLORS.text,
  },
});

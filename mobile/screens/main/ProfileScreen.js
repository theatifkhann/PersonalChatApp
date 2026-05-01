import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import AppButton from "../../components/ui/AppButton";
import Avatar from "../../components/ui/Avatar";
import { COLORS, RADIUS, SHADOW } from "../../constants/theme";

const SETTINGS = ["Account", "Privacy", "Notifications", "Theme"];

export default function ProfileScreen({ currentUser, connectionStatus, logout }) {
  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>You</Text>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <Avatar
          label={currentUser.username}
          online={connectionStatus === "connected"}
          source={currentUser.avatar_url}
          size={92}
        />
        <Text style={styles.name}>@{currentUser.username}</Text>
        <Text style={styles.email}>{currentUser.email}</Text>
        <AppButton title="Edit profile" variant="ghost" />
      </View>

      <View style={styles.settings}>
        {SETTINGS.map((item) => (
          <Pressable key={item} style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>{item}</Text>
              <Text style={styles.settingSubtitle}>Manage {item.toLowerCase()}</Text>
            </View>
            <Text style={styles.chevron}>Next</Text>
          </Pressable>
        ))}
      </View>

      <AppButton onPress={logout} title="Logout" variant="danger" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: COLORS.background,
    flex: 1,
    gap: 16,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  eyebrow: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "900",
  },
  profileCard: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: 10,
    padding: 22,
    ...SHADOW,
  },
  name: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "900",
  },
  email: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 8,
  },
  settings: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    alignItems: "center",
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  settingTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  settingSubtitle: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 3,
  },
  chevron: {
    color: COLORS.muted,
    fontSize: 24,
    fontWeight: "300",
  },
});

import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import {
  ACCENT,
  BORDER,
  SURFACE_MUTED,
  TEXT_PRIMARY,
  TEXT_SECONDARY,
} from "../../constants/theme";
import { buildAvatarFallback } from "../../utils/chat";

export default function AvatarPicker({
  avatarUrl,
  username,
  onPickAvatar,
  onClearAvatar,
  isPickingAvatar,
}) {
  const handlePickAvatar = (event) => {
    event?.preventDefault?.();
    onPickAvatar();
  };

  const handleClearAvatar = (event) => {
    event?.preventDefault?.();
    onClearAvatar();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Profile Photo</Text>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          disabled={isPickingAvatar}
          onPress={handlePickAvatar}
          style={styles.avatarButton}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {buildAvatarFallback(username || "P")}
              </Text>
            </View>
          )}
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>+</Text>
          </View>
        </Pressable>

        <View style={styles.meta}>
          <Text style={styles.title}>
            {avatarUrl ? "Photo selected" : "Choose from gallery"}
          </Text>
          <Text style={styles.subtitle}>
            Pick a square profile photo like a messaging app.
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              disabled={isPickingAvatar}
              onPress={handlePickAvatar}
            >
              <Text style={styles.actionText}>
                {isPickingAvatar ? "Opening..." : avatarUrl ? "Change" : "Choose"}
              </Text>
            </Pressable>
            {avatarUrl ? (
              <Pressable
                accessibilityRole="button"
                disabled={isPickingAvatar}
                onPress={handleClearAvatar}
              >
                <Text style={styles.clearText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  label: {
    color: TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 14,
  },
  avatarButton: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarImage: {
    borderRadius: 40,
    height: 80,
    width: 80,
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: SURFACE_MUTED,
    borderColor: BORDER,
    borderRadius: 40,
    borderWidth: 1,
    height: 80,
    justifyContent: "center",
    width: 80,
  },
  avatarFallbackText: {
    color: TEXT_PRIMARY,
    fontSize: 28,
    fontWeight: "800",
  },
  editBadge: {
    alignItems: "center",
    backgroundColor: ACCENT,
    borderRadius: 14,
    bottom: -2,
    height: 28,
    justifyContent: "center",
    position: "absolute",
    right: -2,
    width: 28,
  },
  editBadgeText: {
    color: "#08281f",
    fontSize: 18,
    fontWeight: "900",
    marginTop: -1,
  },
  meta: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: TEXT_PRIMARY,
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    color: TEXT_SECONDARY,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
    marginTop: 4,
  },
  actionText: {
    color: ACCENT,
    fontSize: 13,
    fontWeight: "700",
  },
  clearText: {
    color: "#ff9f9f",
    fontSize: 13,
    fontWeight: "700",
  },
});

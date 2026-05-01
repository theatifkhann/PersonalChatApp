import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";
import AppButton from "./AppButton";
import Avatar from "./Avatar";

export default function UserCard({
  user,
  subtitle,
  actionLabel,
  onAction,
  disabled,
  onPress,
}) {
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper onPress={onPress} style={styles.card}>
      <Avatar label={user.username} source={user.avatar_url} size={48} />
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>@{user.username}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{subtitle || `User #${user.user_id}`}</Text>
      </View>
      {actionLabel ? (
        <AppButton
          disabled={disabled}
          onPress={onAction}
          style={styles.action}
          title={actionLabel}
          variant="ghost"
        />
      ) : null}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
  },
  action: {
    minHeight: 40,
    paddingHorizontal: 12,
  },
});

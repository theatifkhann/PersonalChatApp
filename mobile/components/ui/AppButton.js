import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";

export default function AppButton({
  title,
  onPress,
  disabled = false,
  variant = "primary",
  style,
}) {
  const isGhost = variant === "ghost";
  const isDanger = variant === "danger";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isGhost ? styles.ghost : styles.primary,
        isDanger ? styles.danger : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
        style,
      ]}
    >
      <Text style={[styles.text, isGhost || isDanger ? styles.ghostText : null]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    borderRadius: RADIUS.md,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  danger: {
    backgroundColor: "rgba(248,113,113,0.12)",
    borderColor: "rgba(248,113,113,0.28)",
    borderWidth: 1,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  text: {
    color: "#03110A",
    fontSize: 15,
    fontWeight: "800",
  },
  ghostText: {
    color: COLORS.text,
  },
});

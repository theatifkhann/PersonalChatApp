import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { COLORS } from "../../constants/theme";
import { buildAvatarFallback } from "../../utils/chat";

export default function Avatar({ source, label, size = 48, online = false }) {
  return (
    <View style={[styles.wrap, { height: size, width: size, borderRadius: size / 2 }]}>
      {source ? (
        <Image source={{ uri: source }} style={[styles.image, { borderRadius: size / 2 }]} />
      ) : (
        <View style={[styles.fallback, { borderRadius: size / 2 }]}>
          <Text style={[styles.fallbackText, { fontSize: Math.max(14, size * 0.36) }]}>
            {buildAvatarFallback(label)}
          </Text>
        </View>
      )}
      {online ? <View style={styles.onlineDot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: COLORS.cardSoft,
    position: "relative",
  },
  image: {
    height: "100%",
    width: "100%",
  },
  fallback: {
    alignItems: "center",
    backgroundColor: COLORS.cardSoft,
    borderColor: COLORS.border,
    borderWidth: 1,
    height: "100%",
    justifyContent: "center",
    width: "100%",
  },
  fallbackText: {
    color: COLORS.text,
    fontWeight: "800",
  },
  onlineDot: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.background,
    borderRadius: 7,
    borderWidth: 2,
    bottom: 1,
    height: 14,
    position: "absolute",
    right: 1,
    width: 14,
  },
});

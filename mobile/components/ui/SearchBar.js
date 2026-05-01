import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";

export default function SearchBar({ value, onChangeText, placeholder = "Search" }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>S</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  icon: {
    color: COLORS.muted,
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    color: COLORS.text,
    flex: 1,
    fontSize: 15,
    minHeight: 48,
  },
});

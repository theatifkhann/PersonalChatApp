import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { COLORS, RADIUS } from "../../constants/theme";
import { formatTime, normalizeMessageKind } from "../../utils/chat";

function TickMarks({ message }) {
  if (message.readAt) {
    return <Text style={[styles.tick, styles.tickRead]}>✓✓</Text>;
  }
  if (message.deliveredAt) {
    return <Text style={styles.tick}>✓✓</Text>;
  }
  return <Text style={styles.tick}>✓</Text>;
}

export default function MessageBubble({ message, currentUserId }) {
  const kind = normalizeMessageKind(message, currentUserId);
  const mine = kind === "outgoing";
  const system = kind === "system" || kind === "error";

  return (
    <View style={[styles.row, mine ? styles.rowMine : system ? styles.rowCenter : styles.rowOther]}>
      <View style={[styles.bubble, mine ? styles.mine : system ? styles.system : styles.other]}>
        {system ? <Text style={styles.systemLabel}>{kind.toUpperCase()}</Text> : null}
        <Text style={[styles.text, mine ? styles.mineText : null]}>{message.text}</Text>
        <View style={styles.metaRow}>
          <Text style={[styles.time, mine ? styles.mineTime : null]}>
            {formatTime(message.createdAt)}
          </Text>
          {mine && !system ? <TickMarks message={message} /> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  rowMine: {
    justifyContent: "flex-end",
  },
  rowOther: {
    justifyContent: "flex-start",
  },
  rowCenter: {
    justifyContent: "center",
  },
  bubble: {
    borderRadius: RADIUS.md,
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  mine: {
    backgroundColor: COLORS.bubbleMine,
    borderTopRightRadius: 5,
  },
  other: {
    backgroundColor: COLORS.bubbleOther,
    borderTopLeftRadius: 5,
  },
  system: {
    backgroundColor: COLORS.system,
    borderColor: COLORS.border,
    borderWidth: 1,
    maxWidth: "94%",
  },
  text: {
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 21,
  },
  mineText: {
    color: "#03110A",
    fontWeight: "600",
  },
  metaRow: {
    alignSelf: "flex-end",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    marginTop: 5,
  },
  time: {
    color: COLORS.muted,
    fontSize: 10,
  },
  mineTime: {
    color: "rgba(3,17,10,0.62)",
  },
  tick: {
    color: "rgba(3,17,10,0.62)",
    fontSize: 11,
    fontWeight: "900",
  },
  tickRead: {
    color: "#2563EB",
  },
  systemLabel: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
    marginBottom: 4,
  },
});

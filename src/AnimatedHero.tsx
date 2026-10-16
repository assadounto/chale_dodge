import React, { useEffect, useState } from "react";
import { AppState, Image, View } from "react-native";
import { ATLAS_COLUMNS, ATLAS_ROWS, HeroPose, spriteFrame } from "./animation";
const atlases = {
  classic: require("../assets/animation/classic.png"),
  teal: require("../assets/animation/teal.png"),
  purple: require("../assets/animation/purple.png"),
};
export function AnimatedHero({
  size,
  shirt,
  pose,
  distance = 0,
  seconds = 0,
}: {
  size: number;
  shirt: string;
  pose: HeroPose;
  distance?: number;
  seconds?: number;
}) {
  const [danceTick, setDanceTick] = useState(0);
  const [active, setActive] = useState(
    AppState.currentState !== "background" &&
      AppState.currentState !== "inactive",
  );
  useEffect(() => {
    if (pose !== "victory") return;
    const subscription = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => subscription.remove();
  }, [pose]);
  useEffect(() => {
    if (pose !== "victory" || !active) return;
    const timer = setInterval(() => setDanceTick((tick) => tick + 1), 125);
    return () => clearInterval(timer);
  }, [pose, active]);
  const frame = spriteFrame(
    pose,
    distance,
    pose === "victory" ? danceTick / 8 : seconds,
  );
  const atlas =
    shirt === "#42dfc4"
      ? atlases.teal
      : shirt === "#b99aff"
        ? atlases.purple
        : atlases.classic;
  return (
    <View
      testID={`hero-${pose}-${frame}`}
      pointerEvents="none"
      style={{ width: size, height: size, overflow: "hidden" }}
    >
      <Image
        source={atlas}
        resizeMode="stretch"
        fadeDuration={0}
        style={{
          position: "absolute",
          width: size * ATLAS_COLUMNS,
          height: size * ATLAS_ROWS,
          left: -(frame % ATLAS_COLUMNS) * size,
          top: -Math.floor(frame / ATLAS_COLUMNS) * size,
        }}
      />
    </View>
  );
}

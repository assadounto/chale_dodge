import React from "react";
import { Image, View } from "react-native";
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
} from "react-native-svg";
export function Hero({
  size = 72,
  mood = "happy",
  stride = 0,
  shirt = "#ffda3d",
  portrait = false,
}: {
  size?: number;
  mood?: "happy" | "shock";
  stride?: number;
  shirt?: string;
  shorts?: string;
  portrait?: boolean;
}) {
  const source =
    portrait && mood === "shock"
      ? require("../assets/art/reaction-shock.png")
      : shirt === "#42dfc4"
        ? require("../assets/art/hero-teal.png")
        : shirt === "#b99aff"
          ? require("../assets/art/hero-purple.png")
          : require("../assets/art/hero-classic.png");
  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={source}
        resizeMode="contain"
        fadeDuration={0}
        style={{
          width: "100%",
          height: "100%",
          transform: [
            { translateY: -Math.abs(stride) * 2 },
            { rotate: `${stride * 4}deg` },
          ],
        }}
      />
    </View>
  );
}
export function Obstacle({
  kind,
  size = 44,
  angle = 0,
}: {
  kind: "tyre" | "slipper" | "ball";
  size?: number;
  angle?: number;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 50 50">
      <Defs>
        <RadialGradient id="rubber" cx={0.35} cy={0.25} r={0.8}>
          <Stop offset="0" stopColor="#657183" />
          <Stop offset={0.6} stopColor="#263141" />
          <Stop offset="1" stopColor="#101b2b" />
        </RadialGradient>
        <LinearGradient id="slipper" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#83efff" />
          <Stop offset={0.5} stopColor="#189acb" />
          <Stop offset="1" stopColor="#14517e" />
        </LinearGradient>
        <RadialGradient id="ball" cx={0.3} cy={0.25} r={0.8}>
          <Stop offset="0" stopColor="#fff1a3" />
          <Stop offset={0.6} stopColor="#ffcb3b" />
          <Stop offset="1" stopColor="#f37b23" />
        </RadialGradient>
      </Defs>
      <G rotation={angle} origin="25,25">
        {kind === "tyre" ? (
          <>
            <Path
              d="M25 3A22 22 0 1 1 24.99 3ZM25 15A10 10 0 1 0 25.01 15Z"
              fill="url(#rubber)"
              fillRule="evenodd"
              stroke="#09182b"
              strokeWidth="2.5"
            />
            <Circle
              cx="25"
              cy="25"
              r="12"
              fill="none"
              stroke="#7a8797"
              strokeWidth="2"
            />
            <Path
              d="M12 10L16 14M24 4L24 10M37 8L34 13M45 20L39 22M43 35L38 32M32 45L31 39M16 43L18 38M5 30L11 29M6 17L12 20"
              stroke="#0b1728"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <Path
              d="M8 23Q9 12 19 8"
              fill="none"
              stroke="#b0bed0"
              strokeWidth="2"
              strokeLinecap="round"
              opacity={0.65}
            />
          </>
        ) : kind === "slipper" ? (
          <>
            <Path
              d="M18 4Q35 0 36 18L33 39Q30 51 17 44Q9 40 13 29Z"
              fill="url(#slipper)"
              stroke="#15354c"
              strokeWidth="3"
            />
            <Path
              d="M16 24L25 16L34 25M25 16L26 10"
              fill="none"
              stroke="#e9ffff"
              strokeWidth="4"
            />
          </>
        ) : (
          <>
            <Circle
              cx="25"
              cy="25"
              r="20"
              fill="url(#ball)"
              stroke="#793c3b"
              strokeWidth="3"
            />
            <Path
              d="M25 5Q2 25 25 45M25 5Q48 25 25 45M5 25H45"
              fill="none"
              stroke="#f0784f"
              strokeWidth="4"
            />
          </>
        )}
      </G>
    </Svg>
  );
}

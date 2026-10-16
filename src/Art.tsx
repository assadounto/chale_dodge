import React from "react";
import Svg, { Ellipse, Circle, Path, G } from "react-native-svg";
export function Hero({
  size = 72,
  mood = "happy",
}: {
  size?: number;
  mood?: "happy" | "shock";
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 88">
      <Ellipse cx="40" cy="81" rx="24" ry="5" fill="#152338" opacity=".18" />
      <Path
        d="M29 59L25 75L17 79M49 59L54 75L64 78"
        stroke="#182d48"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <Path
        d="M22 76L15 81M58 77L66 81"
        stroke="#fff5df"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <Path
        d="M26 39L14 53M54 39L65 50"
        stroke="#9d532d"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <Path
        d="M29 34L50 34L57 60Q40 68 23 60Z"
        fill="#ffda3d"
        stroke="#182638"
        strokeWidth="3"
      />
      <Circle
        cx="40"
        cy="24"
        r="18"
        fill="#a95e34"
        stroke="#182638"
        strokeWidth="2"
      />
      <Path
        d="M21 24Q16 8 26 7Q27 0 35 5Q43 -2 48 5Q61 2 60 15L56 25L52 16Q35 23 26 15Z"
        fill="#172233"
      />
      <Ellipse cx="33" cy="24" rx="4" ry="5" fill="white" />
      <Ellipse cx="47" cy="24" rx="4" ry="5" fill="white" />
      <Circle cx="34" cy="25" r="2" fill="#132137" />
      <Circle cx="46" cy="25" r="2" fill="#132137" />
      {mood === "shock" ? (
        <Ellipse cx="40" cy="35" rx="5" ry="7" fill="#381c25" />
      ) : (
        <Path
          d="M31 32Q40 47 50 31Q40 35 31 32"
          fill="white"
          stroke="#45242a"
          strokeWidth="2"
        />
      )}
    </Svg>
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
      <G rotation={angle} origin="25,25">
        {kind === "tyre" ? (
          <>
            <Circle
              cx="25"
              cy="25"
              r="22"
              fill="#233044"
              stroke="#111b29"
              strokeWidth="3"
            />
            <Circle
              cx="25"
              cy="25"
              r="11"
              fill="#bd8a63"
              stroke="#607287"
              strokeWidth="4"
            />
            <Path
              d="M10 10L15 15M36 35L41 40M9 36L14 32M36 14L41 10"
              stroke="#758497"
              strokeWidth="3"
            />
          </>
        ) : kind === "slipper" ? (
          <>
            <Path
              d="M18 4Q35 0 36 18L33 39Q30 51 17 44Q9 40 13 29Z"
              fill="#39b8e5"
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
              fill="#ffcd42"
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

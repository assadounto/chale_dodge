import React from "react";
import { StyleSheet, Text, View, TextStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  G,
  Rect,
} from "react-native-svg";
import { logoPaths } from "./logoPaths";
export const displayFont = "ChaleDisplay";
export function GameLogo({ width = 280 }: { width?: number }) {
  return (
    <View accessibilityLabel="Chale, Dodge!" accessibilityRole="header">
      <Svg width={width} height={width * 0.46} viewBox="0 0 500 230">
        <Defs>
          <LinearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#fff08c" />
            <Stop offset={0.5} stopColor="#ffd139" />
            <Stop offset="1" stopColor="#ff8b22" />
          </LinearGradient>
          <LinearGradient id="aqua" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#a6fff0" />
            <Stop offset={0.5} stopColor="#29e4d6" />
            <Stop offset="1" stopColor="#0798b9" />
          </LinearGradient>
        </Defs>
        <G rotation={-4} origin="250,115">
          {logoPaths.map((d, i) => (
            <G key={i}>
              <Path
                d={d}
                fill="#061529"
                stroke="#061529"
                strokeWidth={17}
                strokeLinejoin="round"
                transform="translate(0 9)"
              />
              <Path
                d={d}
                fill={i === 0 ? "url(#gold)" : "url(#aqua)"}
                stroke="#061529"
                strokeWidth={12}
                strokeLinejoin="round"
              />
              <Path d={d} fill={i === 0 ? "url(#gold)" : "url(#aqua)"} />
            </G>
          ))}
        </G>
        <Path
          d="M26 30L10 17M20 56L2 53M473 23L487 9M481 48L499 41"
          stroke="#ffcf39"
          strokeWidth="8"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
export function ButtonFace({ secondary = false }: { secondary?: boolean }) {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 300 70"
      preserveAspectRatio="none"
    >
      <Defs>
        <LinearGradient
          id={secondary ? "navyButton" : "limeButton"}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <Stop offset="0" stopColor={secondary ? "#29456a" : "#f1ff93"} />
          <Stop offset={0.5} stopColor={secondary ? "#172d4d" : "#d4fc3b"} />
          <Stop offset="1" stopColor={secondary ? "#10203a" : "#aadd13"} />
        </LinearGradient>
      </Defs>
      <Rect
        width="300"
        height="70"
        rx="20"
        fill={`url(#${secondary ? "navyButton" : "limeButton"})`}
      />
      <Path
        d="M24 7H276"
        stroke={secondary ? "#55769d" : "#faffce"}
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.8}
      />
    </Svg>
  );
}
export function ComicHeading({
  text,
  color = "#ffda42",
  size = 29,
}: {
  text: string;
  color?: string;
  size?: number;
}) {
  const textStyle: TextStyle = {
    fontFamily: displayFont,
    fontSize: size,
    lineHeight: size * 1.12,
    textAlign: "center",
    color,
  };
  return (
    <View style={{ alignSelf: "stretch", marginVertical: 4 }}>
      {[
        [-2, -2],
        [0, -2],
        [2, -2],
        [-2, 0],
        [2, 0],
        [-2, 2],
        [0, 2],
        [2, 2],
        [0, 4],
      ].map(([x, y], i) => (
        <Text
          key={i}
          accessible={false}
          aria-hidden={true}
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          style={[
            textStyle,
            StyleSheet.absoluteFill,
            {
              color: "#07172d",
              transform: [{ translateX: x }, { translateY: y }],
            },
          ]}
        >
          {text}
        </Text>
      ))}
      <Text accessibilityRole="header" style={textStyle}>
        {text}
      </Text>
    </View>
  );
}
export function ComicBurst({ text, bonus }: { text: string; bonus?: string }) {
  return (
    <View
      style={{
        width: 250,
        height: 110,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "-5deg" }],
      }}
    >
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox="0 0 280 120"
      >
        <Path
          d="M5 52L28 42L16 17L51 24L62 4L88 19L116 5L133 20L165 3L177 23L211 8L215 29L253 21L245 45L274 56L252 73L263 99L225 93L216 116L186 101L160 117L140 102L107 117L91 99L54 112L51 92L15 99L26 75Z"
          fill="#ff5b34"
          stroke="#07172d"
          strokeWidth="4"
        />
        <Path
          d="M17 53L39 45L29 29L57 34L67 17L90 30L115 18L134 31L163 17L175 35L203 23L207 41L238 34L232 49L259 58L239 72L250 88L219 83L210 103L184 90L160 105L140 91L108 104L94 87L64 99L62 80L29 87L39 70Z"
          fill="#fff8df"
        />
      </Svg>
      <Text
        style={{
          fontFamily: displayFont,
          fontSize: 23,
          color: "#091a30",
          textAlign: "center",
          maxWidth: 210,
          lineHeight: 26,
        }}
      >
        {text}
      </Text>
      {bonus && (
        <Text
          style={{
            fontFamily: displayFont,
            fontSize: 25,
            color: "#5a8500",
            marginTop: 2,
          }}
        >
          {bonus}
        </Text>
      )}
    </View>
  );
}

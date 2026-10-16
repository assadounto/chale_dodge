import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  ImageBackground,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { Hero, Obstacle } from "./src/Art";
import {
  aim,
  clamp,
  createWorld,
  DURATION,
  HEIGHT,
  step,
  WIDTH,
  World,
} from "./src/engine";
type Screen = "home" | "playing" | "paused" | "result";
const NAVY = "#101f35",
  LIME = "#d5ff48";
const failures = [
  "YOU HAD ONE JOB!",
  "THE SLIPPER HAD A PLAN.",
  "YOUR CONFIDENCE WAS THE PROBLEM.",
  "CHALE… WHAT WAS THAT?",
];
function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: "#fff" }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}
function Game() {
  const { width, height } = useWindowDimensions();
  const scale = Math.min((width - 24) / WIDTH, (height - 105) / HEIGHT, 1.3);
  const world = useRef(createWorld());
  const [w, setSnapshot] = useState<World>(createWorld);
  const [failure, setFailure] = useState(failures[0]);
  const [screen, setScreen] = useState<Screen>("home");
  const screenRef = useRef<Screen>("home");
  const [best, setBest] = useState(0),
    [muted, setMuted] = useState(false),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false);
  const bestRef = useRef(0),
    mutedRef = useRef(false),
    anchor = useRef({ x: 180, y: 450 }),
    held = useRef(new Set<string>());
  const dodgeSound = useAudioPlayer(require("./assets/audio/dodge.wav"));
  const loseSound = useAudioPlayer(require("./assets/audio/fail.wav"));
  const winSound = useAudioPlayer(require("./assets/audio/win.wav"));
  function navigate(s: Screen) {
    screenRef.current = s;
    setScreen(s);
    held.current.clear();
  }
  const play = useCallback(
    (kind: "dodge" | "lost" | "won") => {
      if (mutedRef.current) return;
      const p =
        kind === "dodge" ? dodgeSound : kind === "lost" ? loseSound : winSound;
      p.seekTo(0)
        .then(() => p.play())
        .catch(() => {});
    },
    [dodgeSound, loseSound, winSound],
  );
  useEffect(() => {
    let live = true;
    AsyncStorage.multiGet(["chale.best", "chale.muted"])
      .then((rows) => {
        if (!live) return;
        const saved = Number(rows[0][1] || 0);
        bestRef.current = Number.isFinite(saved) ? Math.max(0, saved) : 0;
        setBest(bestRef.current);
        mutedRef.current = rows[1][1] === "true";
        setMuted(mutedRef.current);
      })
      .catch(() => {
        if (live) setStorageError(true);
      })
      .finally(() => {
        if (live) setReady(true);
      });
    return () => {
      live = false;
    };
  }, []);
  function toggleSound() {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    AsyncStorage.setItem("chale.muted", String(next)).catch(() =>
      setStorageError(true),
    );
  }
  function start() {
    world.current = createWorld();
    setFailure(failures[Math.floor(Math.random() * failures.length)]);
    setSnapshot({
      ...world.current,
      hazards: world.current.hazards.map((h) => ({ ...h })),
    });
    navigate("playing");
  }
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active" && screenRef.current === "playing") navigate("paused");
    });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    let last = 0,
      id = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.04) : 0;
      last = now;
      if (screenRef.current === "playing") {
        const w = world.current;
        const k = held.current;
        let dx =
            (k.has("ArrowRight") || k.has("d") ? 1 : 0) -
            (k.has("ArrowLeft") || k.has("a") ? 1 : 0),
          dy =
            (k.has("ArrowDown") || k.has("s") ? 1 : 0) -
            (k.has("ArrowUp") || k.has("w") ? 1 : 0);
        if (dx || dy) {
          const d = Math.hypot(dx, dy);
          aim(w, w.x + (dx / d) * 340 * dt, w.y + (dy / d) * 340 * dt);
        }
        const event = w.event;
        step(w, dt);
        if (w.event !== event)
          play(w.status === "playing" ? "dodge" : w.status);
        if (w.status !== "playing") {
          navigate("result");
          if (w.elapsed > bestRef.current) {
            bestRef.current = w.elapsed;
            setBest(w.elapsed);
            AsyncStorage.setItem("chale.best", String(w.elapsed)).catch(() =>
              setStorageError(true),
            );
          }
        }
        setSnapshot({
          ...world.current,
          hazards: world.current.hazards.map((h) => ({ ...h })),
        });
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [play]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const down = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      held.current.add(e.key);
      if (e.key === "Escape") {
        if (screenRef.current === "playing") navigate("paused");
        else if (screenRef.current === "paused") navigate("playing");
      }
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.key);
    const blur = () => {
      held.current.clear();
      if (screenRef.current === "playing") navigate("paused");
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const responder = useMemo(
    () =>
      // PanResponder stores these callbacks; refs are read only when a gesture fires.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => screenRef.current === "playing",
        onMoveShouldSetPanResponder: () => screenRef.current === "playing",
        onPanResponderGrant: () => {
          anchor.current = { x: world.current.x, y: world.current.y };
        },
        onPanResponderMove: (_, g) => {
          if (screenRef.current === "playing")
            aim(
              world.current,
              anchor.current.x + g.dx / scale,
              anchor.current.y + g.dy / scale,
            );
        },
        onPanResponderRelease: () => {
          world.current.targetX = world.current.x;
          world.current.targetY = world.current.y;
        },
        onPanResponderTerminate: () => {
          world.current.targetX = world.current.x;
          world.current.targetY = world.current.y;
        },
      }),
    [scale],
  );
  const won = w.status === "won";
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.top}>
        <Text style={styles.wordmark}>
          CHALE<Text style={{ color: LIME }}>, DODGE!</Text>
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={muted ? "Enable sound" : "Mute sound"}
          onPress={toggleSound}
          style={styles.sound}
        >
          <Text style={styles.small}>{muted ? "SOUND OFF" : "SOUND ON"}</Text>
        </Pressable>
      </View>
      <View
        style={[styles.arena, { width: WIDTH * scale, height: HEIGHT * scale }]}
      >
        <ImageBackground
          source={require("./assets/courtyard.jpg")}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
        <View
          pointerEvents="none"
          style={[styles.shade, StyleSheet.absoluteFill]}
        />
        {screen !== "home" && (
          <>
            <View style={styles.hud}>
              <View style={styles.hudPill}>
                <Text style={styles.time}>
                  {Math.floor(w.elapsed).toString().padStart(2, "0")}
                  <Text style={styles.unit}> / 60s</Text>
                </Text>
                <Text style={styles.best}>BEST {best.toFixed(1)}s</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Pause game"
                onPress={() => {
                  if (screen === "playing") navigate("paused");
                }}
                style={styles.pause}
              >
                <Text style={styles.pauseText}>Ⅱ</Text>
              </Pressable>
            </View>
            <View
              pointerEvents="none"
              style={[
                styles.progress,
                { width: `${(w.elapsed / DURATION) * 100}%` },
              ]}
            />
          </>
        )}
        {(screen === "playing" ||
          screen === "paused" ||
          screen === "result") && (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {w.hazards.map((h) => (
              <View
                key={h.id}
                style={{
                  position: "absolute",
                  left:
                    ((h.age < h.warned ? clamp(h.x, 25, WIDTH - 25) : h.x) -
                      25) *
                    scale,
                  top:
                    ((h.age < h.warned ? clamp(h.y, 115, HEIGHT - 35) : h.y) -
                      25) *
                    scale,
                  opacity: h.age < h.warned ? 0.45 : 1,
                }}
              >
                <Obstacle kind={h.kind} size={50 * scale} angle={h.age * 200} />
                {h.age < h.warned && (
                  <Text style={[styles.warning, { fontSize: 26 * scale }]}>
                    !
                  </Text>
                )}
              </View>
            ))}
            <View
              style={{
                position: "absolute",
                left: (w.x - 30) * scale,
                top: (w.y - 40) * scale,
              }}
            >
              <Hero
                size={60 * scale}
                mood={w.status === "lost" ? "shock" : "happy"}
              />
            </View>
          </View>
        )}
        {screen === "playing" && (
          <>
            <View style={StyleSheet.absoluteFill} {...responder.panHandlers} />
            <View pointerEvents="none" style={styles.bottomHud}>
              <Text style={styles.combo}>
                {w.dodges} CLOSE CALLS · {w.score} PTS
              </Text>
              <Text style={styles.hint}>
                DRAG ANYWHERE TO DODGE
                {Platform.OS === "web" ? " · OR USE ARROW KEYS" : ""}
              </Text>
            </View>
            {w.reactionUntil > w.elapsed && (
              <View pointerEvents="none" style={styles.reaction}>
                <Text style={styles.reactionText}>{w.reaction}</Text>
                <Text style={styles.bonus}>+50</Text>
              </View>
            )}
            {w.elapsed < 3 && (
              <View pointerEvents="none" style={styles.teach}>
                <Text style={styles.teachText}>KEEP MOVING, CHALE!</Text>
                <Text style={styles.teachSmall}>
                  Survive 60 seconds. One hit ends the run.
                </Text>
              </View>
            )}
          </>
        )}
        {screen === "home" && (
          <View style={styles.home}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>60 SECONDS OF WAHALA</Text>
            </View>
            <Text style={styles.title}>
              CHALE,{"\n"}
              <Text style={{ color: LIME }}>DODGE!</Text>
            </Text>
            <Text style={styles.subtitle}>
              Stay alive. Escape trouble.{"\n"}Laugh. Run it back.
            </Text>
            <View style={styles.heroShow}>
              <Obstacle kind="slipper" size={54} />
              <Hero size={150} />
              <Obstacle kind="tyre" size={64} />
            </View>
            <View style={styles.homeCard}>
              <Text style={styles.bestLabel}>YOUR PERSONAL BEST</Text>
              <Text style={styles.bestNumber}>
                {best.toFixed(1)}
                <Text style={styles.unit}> seconds</Text>
              </Text>
              <Button
                label={ready ? "LET’S PLAY  →" : "LOADING…"}
                onPress={() => {
                  if (ready) start();
                }}
              />
              <Text style={styles.instructions}>
                Drag to move · Dodge every obstacle{"\n"}A narrow escape earns
                +50 points
              </Text>
            </View>
            <Text style={styles.offline}>
              MADE OF COURAGE. AND QUESTIONABLE DECISIONS.
            </Text>
          </View>
        )}
        {(screen === "paused" || screen === "result") && (
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.eyebrow}>
                {screen === "paused"
                  ? "TAKE A BREATHER"
                  : won
                    ? "60 SECONDS. ZERO EXCUSES."
                    : "WELL… THAT HAPPENED."}
              </Text>
              <Hero
                size={105}
                mood={screen === "result" && !won ? "shock" : "happy"}
              />
              <Text style={styles.resultTitle}>
                {screen === "paused"
                  ? "SMALL BREAK?"
                  : won
                    ? "YOU SURVIVED!"
                    : failure}
              </Text>
              <Text style={styles.resultDescription}>
                {screen === "paused"
                  ? "The wahala can wait."
                  : won
                    ? "Certified dodging legend. Enjoy your victory."
                    : "Shake it off. The next run is yours."}
              </Text>
              {screen === "result" && (
                <View style={styles.stats}>
                  <View>
                    <Text style={styles.statValue}>
                      {w.elapsed.toFixed(1)}s
                    </Text>
                    <Text style={styles.statLabel}>SURVIVED</Text>
                  </View>
                  <View>
                    <Text style={styles.statValue}>{w.dodges}</Text>
                    <Text style={styles.statLabel}>CLOSE CALLS</Text>
                  </View>
                  <View>
                    <Text style={styles.statValue}>{w.score}</Text>
                    <Text style={styles.statLabel}>POINTS</Text>
                  </View>
                </View>
              )}
              <Button
                label={
                  screen === "paused" ? "BACK TO THE WAHALA" : "RUN IT BACK  ↻"
                }
                onPress={() =>
                  screen === "paused" ? navigate("playing") : start()
                }
              />
              {screen === "result" && (
                <Button
                  secondary
                  label="SHARE MY SCORE"
                  onPress={() => {
                    Share.share({
                      message: `I survived ${w.elapsed.toFixed(1)}s in Chale, Dodge! ${w.dodges} close calls. Can you survive 60 seconds?`,
                    }).catch(() => {});
                  }}
                />
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => navigate("home")}
                style={{ padding: 14 }}
              >
                <Text style={styles.homeLink}>BACK TO HOME</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.footer}>
        {storageError
          ? "Best score is available for this session only."
          : "SMALL ESCAPES. BIG ENERGY."}
      </Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: NAVY,
    alignItems: "center",
    justifyContent: "center",
  },
  top: {
    width: "100%",
    maxWidth: 490,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordmark: { fontWeight: "900", fontSize: 17, color: "#fff" },
  sound: {
    padding: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3c5067",
  },
  small: { fontSize: 9, fontWeight: "800", color: "#c4d1df" },
  arena: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#e9b38b",
    borderWidth: 2,
    borderColor: "#42516a",
  },
  shade: { backgroundColor: "rgba(18,28,42,.06)" },
  hud: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 3,
  },
  hudPill: {
    backgroundColor: NAVY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  time: { fontSize: 26, fontWeight: "900", color: "#fff" },
  unit: { fontSize: 13, color: "#b4c6d8" },
  best: { color: "#ffda55", fontSize: 11, fontWeight: "800", marginTop: 3 },
  pause: {
    width: 44,
    height: 44,
    backgroundColor: NAVY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pauseText: { fontSize: 25, fontWeight: "900", color: "#fff" },
  progress: {
    position: "absolute",
    bottom: 0,
    height: 5,
    backgroundColor: LIME,
    zIndex: 4,
  },
  bottomHud: {
    position: "absolute",
    bottom: 18,
    alignSelf: "center",
    backgroundColor: NAVY,
    padding: 12,
    borderRadius: 14,
  },
  combo: { color: LIME, textAlign: "center", fontSize: 12, fontWeight: "900" },
  hint: {
    color: "#d4dfeb",
    fontSize: 8,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
  },
  warning: {
    position: "absolute",
    top: -18,
    right: 0,
    color: "#cf3327",
    fontWeight: "900",
  },
  reaction: {
    position: "absolute",
    top: "24%",
    alignSelf: "center",
    backgroundColor: "#fff6de",
    borderWidth: 3,
    borderColor: NAVY,
    padding: 14,
    borderRadius: 18,
    transform: [{ rotate: "-5deg" }],
  },
  reactionText: { fontSize: 21, fontWeight: "900", color: NAVY },
  bonus: {
    fontSize: 28,
    fontWeight: "900",
    color: "#467000",
    textAlign: "center",
  },
  teach: {
    position: "absolute",
    top: "38%",
    alignSelf: "center",
    padding: 14,
    backgroundColor: NAVY,
    borderRadius: 16,
  },
  teachText: {
    color: LIME,
    fontWeight: "900",
    textAlign: "center",
    fontSize: 17,
  },
  teachSmall: { color: "#fff", fontSize: 10, marginTop: 7 },
  home: {
    ...{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
    backgroundColor: "rgba(11,27,46,.67)",
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "#2a4550",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagText: { color: LIME, fontSize: 9, fontWeight: "900", letterSpacing: 2 },
  title: {
    color: "#fff2cf",
    fontSize: 54,
    fontWeight: "900",
    lineHeight: 55,
    textAlign: "center",
    marginTop: 12,
    letterSpacing: -2,
  },
  subtitle: {
    color: "#ebf0ef",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginTop: 10,
  },
  heroShow: { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  homeCard: {
    backgroundColor: NAVY,
    width: "100%",
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#4d6277",
  },
  bestLabel: {
    color: "#9cacc2",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    textAlign: "center",
  },
  bestNumber: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 7,
  },
  button: {
    backgroundColor: LIME,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 15,
    alignItems: "center",
    width: "100%",
    marginTop: 8,
  },
  buttonText: { color: NAVY, fontSize: 15, fontWeight: "900" },
  secondary: {
    backgroundColor: "#243b55",
    borderWidth: 1,
    borderColor: "#536881",
  },
  instructions: {
    color: "#bfcede",
    fontSize: 10,
    textAlign: "center",
    lineHeight: 17,
    marginTop: 12,
  },
  offline: {
    color: "#cbd4da",
    fontSize: 7,
    letterSpacing: 1,
    marginTop: 15,
    textAlign: "center",
  },
  overlay: {
    ...{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 },
    backgroundColor: "rgba(7,17,33,.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 5,
  },
  modal: {
    backgroundColor: NAVY,
    borderWidth: 2,
    borderColor: "#4e6984",
    borderRadius: 25,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  eyebrow: {
    color: "#99acbf",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 10,
  },
  resultTitle: {
    color: LIME,
    fontSize: 27,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 4,
  },
  resultDescription: {
    color: "#bdccda",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 19,
    marginVertical: 12,
  },
  stats: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    backgroundColor: "#1a3049",
    paddingVertical: 16,
    borderRadius: 15,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "900",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 7,
    color: "#a8bdd0",
    fontWeight: "800",
    marginTop: 5,
    textAlign: "center",
  },
  homeLink: { color: "#b7c9dc", fontSize: 10, fontWeight: "800" },
  footer: {
    color: "#8da2b8",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingVertical: 9,
  },
});

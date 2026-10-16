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
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  ButtonFace,
  ComicBurst,
  ComicHeading,
  GameLogo,
  displayFont,
} from "./src/ui/Comic";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayer } from "expo-audio";
import { outfits, OutfitId, readOutfit, survivalBadge } from "./src/profile";
import { Hero, Obstacle } from "./src/Art";
import {
  aim,
  clamp,
  createWorld,
  difficulty,
  DURATION,
  HEIGHT,
  step,
  WIDTH,
  World,
} from "./src/engine";
type Screen = "home" | "wardrobe" | "playing" | "paused" | "impact" | "result";
const NAVY = "#091d37",
  LIME = "#d5ff48";
const failures = [
  "YOU HAD ONE JOB!",
  "THE WAHALA HAD A PLAN.",
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
        pressed && { transform: [{ translateY: 3 }, { scale: 0.99 }] },
      ]}
    >
      <ButtonFace secondary={secondary} />
      <Text
        style={[
          styles.buttonText,
          { fontSize: label.length > 18 ? 18 : secondary ? 19 : 28 },
          secondary && { color: "#fff" },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export default function App() {
  const [loaded, error] = useFonts({
    ChaleDisplay: require("./assets/fonts/LuckiestGuy.ttf"),
  });
  if (!loaded && !error)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: NAVY,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ color: LIME, fontSize: 24, fontWeight: "900" }}>
          CHALE, DODGE!
        </Text>
      </View>
    );
  return (
    <SafeAreaProvider>
      <Game />
    </SafeAreaProvider>
  );
}
function Game() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scale = Math.max(
    0.25,
    Math.min(
      (width - insets.left - insets.right - 24) / WIDTH,
      (height - insets.top - insets.bottom - 105) / HEIGHT,
      1.3,
    ),
  );
  const world = useRef(createWorld());
  const [w, setSnapshot] = useState<World>(createWorld);
  const [failure, setFailure] = useState(failures[0]);
  const [outfitId, setOutfitId] = useState<OutfitId>("classic");
  const outfit = outfits.find((item) => item.id === outfitId) ?? outfits[0];
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
    AsyncStorage.multiGet(["chale.best", "chale.muted", "chale.outfit"])
      .then((rows) => {
        if (!live) return;
        const saved = Number(rows[0][1] || 0);
        bestRef.current = Number.isFinite(saved) ? Math.max(0, saved) : 0;
        setBest(bestRef.current);
        mutedRef.current = rows[1][1] === "true";
        setMuted(mutedRef.current);
        setOutfitId(readOutfit(rows[2][1]));
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
  function chooseOutfit(id: OutfitId) {
    setOutfitId(id);
    AsyncStorage.setItem("chale.outfit", id).catch(() => setStorageError(true));
  }
  useEffect(() => {
    if (screen !== "impact") return;
    const timeout = setTimeout(() => navigate("result"), 650);
    return () => clearTimeout(timeout);
  }, [screen]);
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
    // Menus and paused games do not need an animation loop.
    if (screen !== "playing") return;
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
          navigate(w.status === "lost" ? "impact" : "result");
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
  }, [play, screen]);
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
          source={
            screen === "home" || screen === "wardrobe"
              ? require("./assets/art/home-lane.jpg")
              : require("./assets/courtyard.jpg")
          }
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
        />
        <View
          pointerEvents="none"
          style={[styles.shade, StyleSheet.absoluteFill]}
        />
        {screen !== "home" && screen !== "wardrobe" && (
          <>
            <View style={styles.hud}>
              <View style={styles.hudPill}>
                <Text style={styles.time}>
                  {Math.floor(w.elapsed).toString().padStart(2, "0")}
                  <Text style={styles.unit}> / 60s</Text>
                </Text>
                <Text style={styles.best}>BEST {best.toFixed(1)}s</Text>
                <Text style={styles.stage}>{difficulty(w.elapsed)}</Text>
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
          screen === "impact" ||
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
                  opacity:
                    h.age < h.warned ? 0.45 + Math.sin(h.age * 22) * 0.25 : 1,
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
                left: (w.x - 37.5) * scale,
                top: (w.y - 48) * scale,
                transform: [{ scaleX: w.facing }],
              }}
            >
              <Hero
                shirt={outfit.shirt}
                shorts={outfit.shorts}
                stride={
                  w.moving && w.status === "playing"
                    ? Math.sin(w.distance / 9)
                    : 0
                }
                size={75 * scale}
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
            {w.readyFor > 0 && (
              <View pointerEvents="none" style={styles.countdown}>
                <Text style={styles.countdownLabel}>READY, CHALE?</Text>
                <Text style={styles.countdownNumber}>
                  {Math.ceil(w.readyFor)}
                </Text>
                <Text style={styles.countdownHint}>Drag anywhere to move</Text>
              </View>
            )}
            {w.readyFor === 0 && w.reactionUntil > w.elapsed && (
              <View pointerEvents="none" style={styles.reaction}>
                <ComicBurst text={w.reaction} bonus="+50" />
              </View>
            )}
            {w.readyFor === 0 && w.elapsed < 1.5 && (
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
          <ScrollView
            style={styles.homeScroll}
            contentContainerStyle={styles.home}
            bounces={false}
          >
            <GameLogo
              width={Math.min(280, WIDTH * scale - 40, HEIGHT * scale * 0.43)}
            />
            <View style={styles.tag}>
              <Text style={styles.tagText}>60 SECONDS OF WAHALA</Text>
            </View>
            <View
              style={[styles.heroShow, { height: Math.min(215, 175 * scale) }]}
            >
              <View
                style={{
                  position: "absolute",
                  left: 5,
                  top: 15,
                  transform: [{ rotate: "-25deg" }],
                }}
              >
                <Obstacle kind="slipper" size={58 * scale} />
              </View>
              <Hero
                size={Math.min(250, 220 * scale)}
                shirt={outfit.shirt}
                shorts={outfit.shorts}
              />
              <View
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  transform: [{ rotate: "15deg" }],
                }}
              >
                <Obstacle kind="tyre" size={76 * scale} />
              </View>
            </View>
            <View style={styles.homeCard}>
              <View style={styles.bestPill}>
                <Text style={styles.homeBest}>
                  ★ BEST RUN: {best.toFixed(1)}s
                </Text>
              </View>
              <Button
                label={ready ? "▶  PLAY" : "LOADING…"}
                onPress={() => {
                  if (ready) start();
                }}
              />
              <Button
                secondary
                label="CHANGE LOOK"
                onPress={() => navigate("wardrobe")}
              />
              <Text style={styles.instructions}>
                Drag to dodge. One hit. Big wahala.
              </Text>
            </View>
          </ScrollView>
        )}
        {screen === "wardrobe" && (
          <ScrollView
            style={[styles.homeScroll, styles.wardrobeScroll]}
            contentContainerStyle={styles.home}
            bounces={false}
          >
            <Text style={styles.eyebrow}>SAME COURAGE. DIFFERENT DRIP.</Text>
            <ComicHeading
              text="CHOOSE YOUR\nLEGEND"
              color="#35e9db"
              size={34}
            />
            <Text style={styles.resultDescription}>
              Every outfit is free. All have the same speed.
            </Text>
            <View style={styles.outfitRow}>
              {outfits.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: item.id === outfitId }}
                  aria-checked={item.id === outfitId}
                  accessibilityLabel={item.name}
                  onPress={() => chooseOutfit(item.id)}
                  style={[
                    styles.outfitCard,
                    item.id === outfitId && styles.outfitSelected,
                  ]}
                >
                  <Hero size={90} shirt={item.shirt} shorts={item.shorts} />
                  <Text style={styles.outfitName}>{item.name}</Text>
                  <Text style={styles.outfitStatus}>
                    {item.id === outfitId ? "SELECTED" : "CHOOSE"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.resultDescription}>{outfit.description}</Text>
            <Button
              label="PLAY IN THIS LOOK →"
              onPress={() => {
                if (ready) start();
              }}
            />
            <Button
              secondary
              label="BACK TO HOME"
              onPress={() => navigate("home")}
            />
          </ScrollView>
        )}
        {screen === "impact" && (
          <View pointerEvents="none" style={styles.impact}>
            <ComicBurst text="EII!" />
            <Text style={styles.impactSubtitle}>
              THE {w.hitBy?.toUpperCase()} GOT YOU.
            </Text>
          </View>
        )}
        {(screen === "paused" || screen === "result") && (
          <ScrollView
            style={styles.overlayScroll}
            contentContainerStyle={styles.overlay}
            bounces={false}
          >
            <View style={styles.modal}>
              <Text style={styles.eyebrow}>
                {screen === "paused"
                  ? "TAKE A BREATHER"
                  : won
                    ? "60 SECONDS. ZERO EXCUSES."
                    : "WELL… THAT HAPPENED."}
              </Text>
              <Hero
                shirt={outfit.shirt}
                shorts={outfit.shorts}
                portrait={screen === "result" && !won}
                size={screen === "paused" ? 120 : 180}
                mood={screen === "result" && !won ? "shock" : "happy"}
              />
              <ComicHeading
                text={
                  screen === "paused"
                    ? "SMALL BREAK?"
                    : won
                      ? "YOU SURVIVED!"
                      : failure
                }
                color={won ? "#ffce38" : "#fff2cf"}
                size={screen === "paused" ? 30 : 32}
              />

              <Text style={styles.resultDescription}>
                {screen === "paused"
                  ? "The wahala can wait."
                  : won
                    ? "Certified dodging legend. Enjoy your victory."
                    : "Shake it off. The next run is yours."}
              </Text>
              {screen === "result" && (
                <Text style={styles.badge}>{survivalBadge(w.elapsed)}</Text>
              )}
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
                      message: `${survivalBadge(w.elapsed)}! I survived ${w.elapsed.toFixed(1)}s in Chale, Dodge! ${w.dodges} close calls. Can you survive 60 seconds?`,
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
          </ScrollView>
        )}
      </View>
      <Text style={styles.footer}>
        {storageError
          ? "Some preferences could not be saved on this device."
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
  wordmark: {
    fontFamily: displayFont,
    fontWeight: "400",
    fontSize: 17,
    color: "#fff",
  },
  sound: {
    padding: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#3c5067",
  },
  small: {
    fontSize: 9,
    fontFamily: displayFont,
    fontWeight: "400",
    color: "#c4d1df",
  },
  arena: {
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: "#e9b38b",
    borderWidth: 3,
    borderColor: "#6b89a3",
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
  time: {
    fontSize: 26,
    fontFamily: displayFont,
    fontWeight: "400",
    color: "#fff",
  },
  unit: { fontSize: 13, color: "#b4c6d8" },
  best: {
    color: "#ffda55",
    fontSize: 11,
    fontFamily: displayFont,
    fontWeight: "400",
    marginTop: 3,
  },
  pause: {
    width: 44,
    height: 44,
    backgroundColor: NAVY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stage: {
    color: "#b8d4e0",
    fontSize: 8,
    fontFamily: displayFont,
    fontWeight: "400",
    letterSpacing: 1,
    marginTop: 5,
  },
  countdown: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(13,30,48,.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownLabel: {
    color: "#fff",
    fontSize: 18,
    fontFamily: displayFont,
    fontWeight: "400",
    letterSpacing: 2,
  },
  countdownNumber: {
    color: LIME,
    fontSize: 108,
    fontFamily: displayFont,
    fontWeight: "400",
    lineHeight: 125,
  },
  countdownHint: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pauseText: {
    fontSize: 25,
    fontFamily: displayFont,
    fontWeight: "400",
    color: "#fff",
  },
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
  combo: {
    color: LIME,
    textAlign: "center",
    fontSize: 12,
    fontFamily: displayFont,
    fontWeight: "400",
  },
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
    fontFamily: displayFont,
    fontWeight: "400",
  },
  reaction: {
    position: "absolute",
    top: "22%",
    alignSelf: "center",
  },
  reactionText: {
    fontSize: 21,
    fontFamily: displayFont,
    fontWeight: "400",
    color: NAVY,
  },
  bonus: {
    fontSize: 28,
    fontFamily: displayFont,
    fontWeight: "400",
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
    fontFamily: displayFont,
    fontWeight: "400",
    textAlign: "center",
    fontSize: 17,
  },
  teachSmall: { color: "#fff", fontSize: 10, marginTop: 7 },
  wardrobeScroll: { backgroundColor: "rgba(6,23,45,.94)" },
  homeScroll: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(11,27,46,.05)",
  },
  home: {
    flexGrow: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  tag: {
    backgroundColor: "#10243d",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagText: {
    color: "#fff3d7",
    fontSize: 11,
    fontFamily: displayFont,
    fontWeight: "400",
    letterSpacing: 2,
  },
  title: {
    color: "#fff2cf",
    fontSize: 54,
    fontFamily: displayFont,
    fontWeight: "400",
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
  bestPill: {
    alignSelf: "center",
    backgroundColor: "#10233a",
    paddingVertical: 6,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#b5cadd",
    marginBottom: 3,
  },
  homeBest: { color: "#ffe26a", fontFamily: displayFont, fontSize: 13 },
  homeCard: { width: "100%", padding: 0, marginTop: 6 },
  bestLabel: {
    color: "#9cacc2",
    fontSize: 9,
    fontFamily: displayFont,
    fontWeight: "400",
    letterSpacing: 2,
    textAlign: "center",
  },
  bestNumber: {
    color: "#fff",
    fontSize: 27,
    fontFamily: displayFont,
    fontWeight: "400",
    textAlign: "center",
    marginVertical: 7,
  },
  button: {
    backgroundColor: LIME,
    paddingVertical: 15,
    paddingHorizontal: 12,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    marginTop: 8,
    borderWidth: 3,
    borderBottomWidth: 7,
    borderColor: "#06172d",
    overflow: "hidden",
  },
  buttonText: {
    color: NAVY,
    fontSize: 15,
    fontFamily: displayFont,
    fontWeight: "400",
  },
  secondary: {
    backgroundColor: "#10243f",
    borderColor: "#07162c",
  },
  instructions: {
    color: "#fff7df",
    backgroundColor: "rgba(9,29,55,.8)",
    borderRadius: 12,
    padding: 5,
    fontFamily: displayFont,
    fontSize: 11,
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
  overlayScroll: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7,17,33,.78)",
    zIndex: 5,
  },
  overlay: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 5,
  },
  modal: {
    backgroundColor: NAVY,
    borderWidth: 3,
    borderBottomWidth: 8,
    borderColor: "#98b1d4",
    borderRadius: 28,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  eyebrow: {
    color: "#99acbf",
    fontSize: 8,
    fontFamily: displayFont,
    fontWeight: "400",
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: 10,
  },
  resultTitle: {
    color: LIME,
    fontSize: 27,
    fontFamily: displayFont,
    fontWeight: "400",
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
    fontSize: 24,
    color: "#fff",
    fontFamily: displayFont,
    fontWeight: "400",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 9,
    color: "#a8bdd0",
    fontFamily: displayFont,
    fontWeight: "400",
    marginTop: 5,
    textAlign: "center",
  },
  homeLink: {
    color: "#b7c9dc",
    fontSize: 10,
    fontFamily: displayFont,
    fontWeight: "400",
  },
  changeLook: { paddingVertical: 12, paddingHorizontal: 10, marginBottom: 4 },
  changeLookText: {
    color: LIME,
    fontSize: 10,
    fontFamily: displayFont,
    fontWeight: "400",
    textAlign: "center",
  },
  outfitRow: {
    flexDirection: "row",
    width: "100%",
    gap: 6,
    marginVertical: 18,
  },
  outfitCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 3,
    borderRadius: 16,
    backgroundColor: NAVY,
    borderWidth: 2,
    borderColor: "#455c72",
  },
  outfitSelected: { borderColor: LIME, backgroundColor: "#263e43" },
  outfitName: {
    color: "#fff",
    fontSize: 10,
    fontFamily: displayFont,
    fontWeight: "400",
    textAlign: "center",
    marginTop: 8,
  },
  outfitStatus: {
    color: LIME,
    fontSize: 8,
    fontFamily: displayFont,
    fontWeight: "400",
    marginTop: 8,
  },
  impact: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,25,20,.3)",
    zIndex: 4,
  },
  impactTitle: {
    fontSize: 76,
    fontFamily: displayFont,
    fontWeight: "400",
    color: "#fff1c2",
    transform: [{ rotate: "-9deg" }],
  },
  impactSubtitle: {
    fontSize: 12,
    color: "#fff",
    fontFamily: displayFont,
    fontWeight: "400",
    backgroundColor: NAVY,
    padding: 10,
    borderRadius: 10,
  },
  badge: {
    color: LIME,
    fontFamily: displayFont,
    fontWeight: "400",
    fontSize: 11,
    borderWidth: 1,
    borderColor: "#6c8858",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 18,
    marginBottom: 15,
  },
  footer: {
    color: "#8da2b8",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    paddingVertical: 9,
  },
});

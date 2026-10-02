import { useCallback, useEffect, useMemo, useState } from "react";
import Scene from "./scene/Scene";
import { Overlay } from "./ui/Overlay";
import { Hud } from "./ui/Hud";
import { Preloader } from "./ui/Preloader";
import { Cursor } from "./ui/Cursor";
import { Flash, Toasts } from "./ui/Effects";
import { IS_MOBILE, STOP_COUNT, STOP_VH, cancelFlight, progressFromScroll, state } from "./lib/state";
import { emit, toast } from "./lib/bus";
import { TRACKS, getTrack, isMuted, setTrack, sfx, startMusic, stopMusic, type TrackId } from "./lib/audio";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
const FLIGHT_BREAK_KEYS = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", " ", "Home", "End"];

export default function App() {
  const mobile = useMemo(() => IS_MOBILE, []);
  const [showPre, setShowPre] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [track, setTrackState] = useState<TrackId>(getTrack());

  // lock scroll until launch, and turn page scroll into camera progress
  useEffect(() => {
    state.isTouch = window.matchMedia("(pointer: coarse)").matches;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.body.classList.add("locked");
    const onScroll = () => {
      if (state.flight) return; // a guided flight owns the camera
      state.target = progressFromScroll();
    };
    const onKey = (e: KeyboardEvent) => {
      // don't treat typing in the terminal as navigation
      if ((e.target as HTMLElement | null)?.tagName === "INPUT") return;
      if (FLIGHT_BREAK_KEYS.includes(e.key)) cancelFlight();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("orientationchange", onScroll);
    window.addEventListener("wheel", cancelFlight, { passive: true });
    window.addEventListener("touchstart", cancelFlight, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("orientationchange", onScroll);
      window.removeEventListener("wheel", cancelFlight);
      window.removeEventListener("touchstart", cancelFlight);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  // which stop are we at (for the HUD and the arrival chime)
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = () => {
      const i = Math.round(state.current);
      if (i !== last) {
        last = i;
        setActive(i);
        // during a guided flight the camera rig chimes once on arrival
        if (state.entered && !state.flight) sfx("arrive", i);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Konami code gives a meteor shower
  useEffect(() => {
    let k = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
      if (k === KONAMI.length) {
        k = 0;
        emit("meteor");
        sfx("roar");
        toast("↑↑↓↓←→←→BA, you found the dino cheat 🦖");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const enter = useCallback((sound: boolean) => {
    state.entered = true;
    state.enterTime = performance.now() / 1000;
    setEntered(true);
    setLeaving(true);
    if (sound) {
      startMusic();
      setSoundOn(true);
    }
    window.setTimeout(() => document.body.classList.remove("locked"), 1200);
    window.setTimeout(() => setShowPre(false), 1400);
  }, []);

  const trackName = (id: TrackId) => TRACKS.find((t) => t.id === id)?.name ?? id;

  const turnOn = useCallback(() => {
    startMusic();
    setSoundOn(true);
    return `Music on, now playing ${trackName(getTrack())}.`;
  }, []);

  const turnOff = useCallback(() => {
    stopMusic();
    setSoundOn(false);
    return "Music off.";
  }, []);

  const toggleSound = useCallback(() => {
    if (isMuted()) turnOn();
    else turnOff();
  }, [turnOn, turnOff]);

  const selectTrack = useCallback((id: TrackId) => {
    setTrack(id);
    setTrackState(id);
    if (isMuted()) {
      startMusic();
      setSoundOn(true);
    }
  }, []);

  // used by the terminal: music, music list, music next, music <name>, music off
  const musicCommand = useCallback(
    (arg: string) => {
      const a = arg.trim().toLowerCase();
      if (!a) return isMuted() ? turnOn() : turnOff();
      if (a === "on") return turnOn();
      if (a === "off" || a === "stop") return turnOff();
      if (a === "list") {
        return [`Tracks: ${TRACKS.map((t) => t.name).join(", ")}`, "Use: music <name>, music next, music off"].join("\n");
      }
      if (a === "next") {
        const i = TRACKS.findIndex((t) => t.id === getTrack());
        const next = TRACKS[(i + 1) % TRACKS.length];
        selectTrack(next.id);
        return `Now playing ${next.name}.`;
      }
      const q = a.replace(/\s+/g, "");
      const hit = TRACKS.find((t) => t.id === q || t.name.toLowerCase().replace(/\s+/g, "") === q);
      if (!hit) return `No track called "${arg}". Try: music list`;
      selectTrack(hit.id);
      return `Now playing ${hit.name}.`;
    },
    [turnOn, turnOff, selectTrack],
  );

  return (
    <>
      <div className="fixed inset-0 z-0">
        <Scene mobile={mobile} />
      </div>

      <Overlay onMusic={musicCommand} />
      <Hud
        visible={entered}
        active={active}
        soundOn={soundOn}
        track={track}
        onToggleSound={toggleSound}
        onSelectTrack={selectTrack}
      />
      <Toasts />
      <Flash />
      <Cursor />
      {showPre && <Preloader onEnter={enter} leaving={leaving} />}

      {/* scroll spacer: the page scroll drives the camera flight */}
      <div aria-hidden style={{ height: `${((STOP_COUNT - 1) * STOP_VH + 1) * 100}vh` }} />
    </>
  );
}

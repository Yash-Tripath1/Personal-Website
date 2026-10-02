import { useCallback, useEffect, useMemo, useState } from "react";
import Scene from "./scene/Scene";
import { Overlay } from "./ui/Overlay";
import { Hud } from "./ui/Hud";
import { Preloader } from "./ui/Preloader";
import { Cursor } from "./ui/Cursor";
import { Flash, Toasts } from "./ui/Effects";
import { STOP_COUNT, STOP_VH, isMobileViewport, state } from "./lib/state";
import { emit, toast } from "./lib/bus";
import { isMuted, sfx, startMusic, stopMusic } from "./lib/audio";

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export default function App() {
  const mobile = useMemo(() => isMobileViewport() || window.matchMedia("(pointer: coarse)").matches, []);
  const [showPre, setShowPre] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [entered, setEntered] = useState(false);
  const [active, setActive] = useState(0);
  const [soundOn, setSoundOn] = useState(false);

  // lock scroll until launch + manage scroll progress
  useEffect(() => {
    state.isTouch = window.matchMedia("(pointer: coarse)").matches;
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    document.body.classList.add("locked");
    const onScroll = () => {
      const p = window.scrollY / (window.innerHeight * STOP_VH);
      state.target = Math.min(STOP_COUNT - 1, Math.max(0, p));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // which stop are we at (for HUD + arrival chime)
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = () => {
      const i = Math.round(state.current);
      if (i !== last) {
        last = i;
        setActive(i);
        if (state.entered) sfx("arrive", i);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Konami → meteor shower
  useEffect(() => {
    let k = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      k = key === KONAMI[k] ? k + 1 : key === KONAMI[0] ? 1 : 0;
      if (k === KONAMI.length) {
        k = 0;
        emit("meteor");
        sfx("roar");
        toast("↑↑↓↓←→←→BA · you found the dino cheat 🦖");
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

  const toggleSound = useCallback(() => {
    if (isMuted()) {
      startMusic();
      setSoundOn(true);
      return "music on ♪";
    }
    stopMusic();
    setSoundOn(false);
    return "music off";
  }, []);

  return (
    <>
      <div className="fixed inset-0 z-0">
        <Scene mobile={mobile} />
      </div>

      <Overlay onToggleMusic={toggleSound} />
      <Hud visible={entered} active={active} soundOn={soundOn} onToggleSound={toggleSound} />
      <Toasts />
      <Flash />
      <Cursor />
      {showPre && <Preloader onEnter={enter} leaving={leaving} />}

      {/* scroll spacer: the page scroll drives the camera flight */}
      <div aria-hidden style={{ height: `${((STOP_COUNT - 1) * STOP_VH + 1) * 100}vh` }} />
    </>
  );
}

"use client";

/* eslint-disable @next/next/no-img-element -- Keep animated WebP reference media intact. */

import Link from "next/link";
import { FrameMark } from "@/components/frame-mark";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  ArrowUp,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Plus,
  Minus,
  Maximize,
  Image as ImageIcon,
  Film,
  Type,
  MousePointer2,
  Hand,
  Menu,
  X,
  Play,
  Pause,
  Sparkles,
  RotateCcw,
  Sun,
  Aperture,
  MonitorPlay,
  Layers,
  Check,
} from "lucide-react";
import s from "./landing.module.css";

const asset = (name: string) => `/reference/${name}`;
function Picture({
  name,
  alt = "",
  className = "",
  style,
}: {
  name: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}) {
  // Animated WebP assets must remain unoptimized to preserve their frames.
  return (
    <img
      src={asset(name)}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      draggable={false}
    />
  );
}
function CTA({
  children = "Get started for free",
  href = "/signup",
  dark = false,
}: {
  children?: ReactNode;
  href?: string;
  dark?: boolean;
}) {
  return (
    <Link className={`${s.cta} ${dark ? s.darkCta : ""}`} href={href}>
      {children}
    </Link>
  );
}
function Logo() {
  return (
    <span className={s.logo}>
      <FrameMark className={s.logoMark} size={28} />
      frame.
    </span>
  );
}
function Stage({
  children,
  id,
  reverse = false,
  className = "",
  length = 180,
}: {
  children: ReactNode;
  id?: string;
  reverse?: boolean;
  className?: string;
  length?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const progress = Math.max(
        0,
        Math.min(
          1,
          (window.innerHeight * 0.65 - rect.top) /
            (rect.height - window.innerHeight * 0.3),
        ),
      );
      el.style.setProperty(
        "--progress",
        String(reduced.matches ? 0.5 : progress),
      );
      el.dataset.phase = String(Math.min(3, Math.floor(progress * 4)));
      if (rect.top < window.innerHeight * 0.92) el.dataset.visible = "true";
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <section
      id={id}
      ref={ref}
      className={`${s.stage} ${className}`}
      style={{ "--length": `${length}vh` } as CSSProperties}
    >
      <div className={`${s.stageCard} ${reverse ? s.reverse : ""}`}>
        {children}
      </div>
    </section>
  );
}
function Copy({
  title,
  text,
  action,
  href,
}: {
  title: string;
  text: string;
  action: string;
  href?: string;
}) {
  return (
    <div className={s.copy}>
      <h3>{title}</h3>
      <p>{text}</p>
      <CTA href={href}>{action}</CTA>
    </div>
  );
}
function HeroCanvas({ paused }: { paused: boolean }) {
  const canvas = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = canvas.current!;
    const observer = new ResizeObserver(([entry]) => {
      element.style.setProperty(
        "--canvas-fit",
        String(entry.contentRect.width / 1100),
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null,
  );
  return (
    <div className={s.canvasFrame}>
      <div
        className={s.canvas}
        ref={canvas}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button,a")) return;
          drag.current = {
            x: e.clientX,
            y: e.clientY,
            ox: offset.x,
            oy: offset.y,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (drag.current)
            setOffset({
              x: Math.max(
                -250,
                Math.min(250, drag.current.ox + e.clientX - drag.current.x),
              ),
              y: Math.max(
                -160,
                Math.min(160, drag.current.oy + e.clientY - drag.current.y),
              ),
            });
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <div className={s.canvasBrand}>
          <Logo />
          <span>
            Untitled project <ChevronDown size={12} />
          </span>
        </div>
        <div className={s.canvasToolbar} aria-hidden="true">
          <Plus />
          <MousePointer2 />
          <Hand />
          <ImageIcon />
          <Type />
          <Film />
        </div>
        <div
          className={`${s.nodes} ${paused ? s.frozen : ""}`}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        >
          <svg
            className={s.connections}
            viewBox="0 0 1100 600"
            fill="none"
            aria-hidden="true"
          >
            <path d="M250 235 C375 235 345 155 485 155" />
            <path d="M250 235 C360 235 225 460 330 460" />
            <path d="M820 155 C940 155 770 400 900 400" />
            <path className={s.flow} d="M250 235 C375 235 345 155 485 155" />
            <path className={s.flow} d="M250 235 C360 235 225 460 330 460" />
          </svg>
          <div className={`${s.node} ${s.referenceNode}`}>
            <span>
              <ImageIcon /> Reference
            </span>
            <Picture
              name="node-0.webp"
              alt="Sculptural golden fabric reference"
            />
          </div>
          <div className={`${s.node} ${s.imageNode}`}>
            <span>
              <ImageIcon /> Image
            </span>
            <Picture
              name="node-1.webp"
              alt="Portrait wrapped in flowing golden fabric"
            />
          </div>
          <div className={`${s.node} ${s.textNode}`}>
            <span>
              <Type /> Creative direction
            </span>
            <p>
              A quiet portrait in golden light. Flowing silk, soft shadows, and
              a cinematic sense of movement.
            </p>
          </div>
          <div className={`${s.node} ${s.videoNode}`}>
            <span>
              <Film /> Video
            </span>
            <Picture
              name={paused ? "node-2.webp" : "vid.webp"}
              alt="Animated cinematic fabric sequence"
            />
            <span className={s.videoTime}>
              <Play size={10} /> 00:04 / 00:08
            </span>
          </div>
        </div>
        <div className={s.canvasHint}>Drag to explore</div>
        <div className={s.canvasZoom}>
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((v) => Math.max(0.6, v - 0.1))}
          >
            <Minus />
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom((v) => Math.min(1.4, v + 0.1))}
          >
            <Plus />
          </button>
          <button
            aria-label="Reset canvas"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <Maximize />
          </button>
        </div>
      </div>
    </div>
  );
}
function AgentDemo() {
  return (
    <div className={`${s.demo} ${s.agentDemo}`}>
      <div className={s.storyboards}>
        {[0, 1, 2].map((n) => (
          <div key={n}>
            <span>Scene {n + 1}</span>
            <Picture name={`node-${n}.webp`} />
            <Picture name={`node-${n === 2 ? 3 : n + 1}.webp`} />
          </div>
        ))}
      </div>
      <div className={s.chat}>
        <div className={s.chatHeader}>
          <Sparkles size={16} /> Your creative assistant <Plus size={15} />
        </div>
        <div className={s.chatBody}>
          <div className={s.bubble}>
            <Picture name="node-1.webp" />
            Shape this footage into a cinematic sequence.
          </div>
          <div className={s.agentResponse}>
            <span className={s.thought}>
              <Check size={12} /> Edit direction ready
            </span>
            <p>Keep the atmosphere. Give every shot room to breathe.</p>
            <div className={s.sceneTable}>
              <span>Sequence</span>
              <span>Direction</span>
              {["The opening", "The movement", "The final frame"].map(
                (x, i) => (
                  <div key={x}>
                    <span>Scene {i + 1}</span>
                    <span>{x}</span>
                  </div>
                ),
              )}
            </div>
            <div className={s.sceneChips}>
              {[0, 1, 2].map((n) => (
                <span key={n}>
                  <Picture name={`node-${n}.webp`} />
                  Scene {n + 1}
                </span>
              ))}
            </div>
          </div>
        </div>
        <Link href="/studio" className={s.promptBox}>
          Describe your edit or add your footage…
          <span>
            <Plus size={15} />
            <ArrowUp size={16} />
          </span>
        </Link>
      </div>
    </div>
  );
}
// Preview tours run only while visible and stop when the user takes control.
function useDemoCycle(
  ref: React.RefObject<HTMLDivElement | null>,
  count: number,
  enabled: boolean,
) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let visible = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      clearInterval(timer);
      if (visible && !document.hidden && !reduced.matches) {
        timer = setInterval(
          () => setStep((value) => (value + 1) % count),
          3200,
        );
      }
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.35 },
    );
    if (ref.current) observer.observe(ref.current);
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
    };
  }, [ref, count, enabled]);
  return step;
}
function LensDemo({ paused }: { paused: boolean }) {
  const [customPreset, setPreset] = useState<number | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const tourStep = useDemoCycle(demoRef, 3, !paused && customPreset === null);
  const preset = customPreset ?? tourStep;
  return (
    <div
      ref={demoRef}
      className={`${s.demo} ${s.lensDemo}`}
      data-demo-step={preset}
    >
      <Picture
        name="node-2.webp"
        alt="Cinematic gold silk composition"
        className={s.mainPreview}
        style={{
          filter: `saturate(${1 + preset * 0.2}) contrast(${1 + preset * 0.08})`,
        }}
      />
      <div className={s.lensPanel}>
        <span>Cinematic look</span>
        <div className={s.lensSlots}>
          {[
            { image: "arri-alexa-35.png", label: "ARRI ALEXA 35" },
            { image: "arri-signature-prime.png", label: "Signature Prime" },
            { label: ["35mm", "50mm", "85mm"][preset] },
            { image: "f1_4.png", label: "f/1.4" },
          ].map((x, i) => (
            <button
              key={i}
              onClick={() => setPreset((preset + 1) % 3)}
              aria-label={`Cycle cinematic preview ${i + 1}`}
            >
              <span className={s.slotTop}>
                {i === 2 ? "85mm" : <Aperture />}
              </span>
              <span key={`${i}-${preset}`} className={s.slotSelected}>
                {x.image ? <Picture name={x.image} /> : x.label}
              </span>
              <span className={s.slotBottom}>
                {i === 2 ? "24mm" : <Aperture />}
              </span>
              <small>{x.label}</small>
            </button>
          ))}
        </div>
      </div>
      <span className={s.concept}>Interactive visual preview</span>
    </div>
  );
}
function AngleDemo({ paused }: { paused: boolean }) {
  const [customAngle, setAngle] = useState<number | null>(null);
  const [customTilt, setTilt] = useState<number | null>(null);
  const [customScale, setScale] = useState<number | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const tourStep = useDemoCycle(
    demoRef,
    4,
    !paused &&
      customAngle === null &&
      customTilt === null &&
      customScale === null,
  );
  const angle = customAngle ?? [-30, 30, 60, -15][tourStep];
  const tilt = customTilt ?? [23, -12, 8, 30][tourStep];
  const scale = customScale ?? [0, 15, 25, 5][tourStep];
  const cubeDrag = useRef<{
    x: number;
    y: number;
    angle: number;
    tilt: number;
  } | null>(null);
  return (
    <div
      ref={demoRef}
      className={`${s.demo} ${s.angleDemo}`}
      data-demo-step={tourStep}
    >
      <Picture
        name="node-1.webp"
        alt="Portrait framing preview"
        className={s.mainPreview}
        style={{
          transform: `perspective(900px) rotateY(${angle * 0.16}deg) rotateX(${tilt * 0.14}deg) scale(${1 + scale / 300})`,
        }}
      />
      <div className={s.anglePanel}>
        <span>Explore the frame</span>
        <div className={s.angleContent}>
          <div
            className={s.cubeScene}
            onPointerDown={(e) => {
              cubeDrag.current = { x: e.clientX, y: e.clientY, angle, tilt };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const drag = cubeDrag.current;
              if (!drag) return;
              setAngle(
                Math.round(
                  Math.max(
                    -90,
                    Math.min(90, drag.angle + (e.clientX - drag.x)),
                  ),
                ),
              );
              setTilt(
                Math.round(
                  Math.max(-45, Math.min(45, drag.tilt - (e.clientY - drag.y))),
                ),
              );
            }}
            onPointerUp={() => {
              cubeDrag.current = null;
            }}
            onPointerCancel={() => {
              cubeDrag.current = null;
            }}
          >
            <div
              className={s.cube}
              style={{ transform: `rotateX(${-tilt}deg) rotateY(${angle}deg)` }}
            >
              {["F", "R", "BK", "L", "T", "B"].map((x, i) => (
                <span
                  key={x}
                  style={{
                    transform: `${i < 4 ? `rotateY(${i * 90}deg)` : `rotateX(${i === 4 ? 90 : -90}deg)`} translateZ(33px)`,
                  }}
                >
                  {x}
                </span>
              ))}
            </div>
          </div>
          <div className={s.sliders}>
            {[
              {
                label: "Rotation",
                value: angle,
                min: -90,
                max: 90,
                set: setAngle,
                unit: "°",
              },
              {
                label: "Tilt",
                value: tilt,
                min: -45,
                max: 45,
                set: setTilt,
                unit: "°",
              },
              {
                label: "Scale",
                value: scale,
                min: 0,
                max: 50,
                set: setScale,
                unit: "",
              },
            ].map((x) => (
              <label key={x.label}>
                {x.label}
                <input
                  type="range"
                  min={x.min}
                  max={x.max}
                  value={x.value}
                  onFocus={() => x.set(x.value)}
                  onChange={(e) => x.set(Number(e.target.value))}
                />
                <b>
                  {x.value}
                  {x.unit}
                </b>
              </label>
            ))}
            <button
              onClick={() => {
                setAngle(-30);
                setTilt(23);
                setScale(0);
              }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          </div>
        </div>
      </div>
      <span className={s.concept}>Interactive visual preview</span>
    </div>
  );
}
function LightDemo({ paused }: { paused: boolean }) {
  const [customBrightness, setBrightness] = useState<number | null>(null);
  const [customWarmth, setWarmth] = useState<number | null>(null);
  const [customLight, setLight] = useState<string | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const tourStep = useDemoCycle(
    demoRef,
    4,
    !paused &&
      customBrightness === null &&
      customWarmth === null &&
      customLight === null,
  );
  const brightness = customBrightness ?? [70, 100, 50, 85][tourStep];
  const warmth = customWarmth ?? [5600, 3000, 7500, 4500][tourStep];
  const light = customLight ?? ["Front", "Left", "Top", "Right"][tourStep];
  return (
    <div
      ref={demoRef}
      className={`${s.demo} ${s.lightDemo}`}
      data-demo-step={tourStep}
    >
      <Picture name="node-5.webp" className={s.secondaryPreview} />
      <Picture
        name="node-3.webp"
        alt="Lighting preview"
        className={s.mainPreview}
        style={{
          filter: `brightness(${brightness / 70}) sepia(${Math.max(0, 6500 - warmth) / 10000})`,
        }}
      />
      <div className={s.lightPanel}>
        <div className={s.lightOrb}>
          <span>
            PERSPECTIVE <i>FRONT</i>
          </span>
          <div className={s.orb}>
            <div
              className={s.beam}
              style={{
                transform: `rotate(${["Left", "Top", "Right", "Front", "Bottom", "Back"].indexOf(light) * 60}deg)`,
              }}
            />
            <Picture name="node-3.webp" />
          </div>
          <small>KEY LIGHT</small>
        </div>
        <div className={s.lightControls}>
          <label>
            Global brightness <b>{brightness}%</b>
            <input
              type="range"
              min="30"
              max="120"
              value={brightness}
              onFocus={() => setBrightness(brightness)}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </label>
          <label>
            Color temperature <b>{warmth} K</b>
            <input
              type="range"
              min="3000"
              max="8000"
              value={warmth}
              onFocus={() => setWarmth(warmth)}
              onChange={(e) => setWarmth(Number(e.target.value))}
            />
          </label>
          <span>Main light</span>
          <div className={s.lightPositions}>
            {["Left", "Top", "Right", "Front", "Bottom", "Back"].map((x) => (
              <button
                key={x}
                aria-pressed={light === x}
                onClick={() => setLight(x)}
              >
                {x}
              </button>
            ))}
          </div>
          <div className={s.rim}>
            Rim light <Sun size={16} />
          </div>
        </div>
      </div>
      <span className={s.concept}>Interactive visual preview</span>
    </div>
  );
}
function ReplaceDemo({ paused }: { paused: boolean }) {
  const [customChoice, setChoice] = useState<number | null>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const tourStep = useDemoCycle(demoRef, 2, !paused && customChoice === null);
  const choice = customChoice ?? tourStep + 1;
  return (
    <div
      ref={demoRef}
      className={`${s.demo} ${s.replaceDemo}`}
      data-demo-step={choice}
    >
      <Picture
        name={
          paused
            ? "replacement-2.webp"
            : choice === 1
              ? "dance.webp"
              : "replaced-vid.webp"
        }
        alt="Motion study of a dancer"
        className={s.mainPreview}
      />
      <div className={s.replacePanel}>
        <span>Object replacement</span>
        <div className={s.replaceItems}>
          <button
            onClick={() => setChoice(1)}
            aria-label="View original motion study"
            aria-pressed={choice === 1}
          >
            <Picture name={`replaced-${choice}.webp`} />
            <b>Selected region</b>
          </button>
          <ArrowRight size={18} />
          <button
            onClick={() => setChoice(choice === 1 ? 2 : 1)}
            aria-label="Switch replacement preview"
          >
            <Picture name={`replacement-${choice}.webp`} />
            <b>Replacement</b>
          </button>
        </div>
        <div className={s.replaceEnd}>
          <span>Visual concept</span>
          <button
            onClick={() => setChoice(choice === 1 ? 2 : 1)}
            aria-label="Play replacement preview"
          >
            <ArrowUp size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
export default function Home() {
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return (
    <main id="top" className={`${s.landing} ${paused ? s.paused : ""}`}>
      <header className={s.header}>
        <a href="#top" aria-label="Frame home">
          <Logo />
        </a>
        <nav
          className={`${s.nav} ${menu ? s.navOpen : ""}`}
          aria-label="Main navigation"
        >
          <a href="#agent" onClick={() => setMenu(false)}>
            Manifesto
          </a>
          <Link href="/login">Sign in</Link>
          <a href="#creators" onClick={() => setMenu(false)}>
            Create <ChevronDown size={12} />
          </a>
          <a href="#cinematic" onClick={() => setMenu(false)}>
            Cinematic
          </a>
          <a href="#possibilities" onClick={() => setMenu(false)}>
            Explore
          </a>
          <a href="#start" onClick={() => setMenu(false)}>
            Get started
          </a>
        </nav>
        <div className={s.headerActions}>
          <span>
            EN <ChevronDown size={12} />
          </span>
          <CTA />
          <button
            className={s.menuToggle}
            aria-label={menu ? "Close menu" : "Open menu"}
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <section className={s.hero}>
        <div className={s.intro}>
          <h1>Your Creative OS</h1>
          <p>
            frame. brings your footage, ideas, and AI editing together.
            <br className={s.desktopBreak} /> From your first take to a finished
            story, in one creative space.
          </p>
          <div className={s.heroActions}>
            <CTA />
            <CTA href="#creators" dark>
              <MonitorPlay size={16} /> Explore the tools
            </CTA>
          </div>
        </div>
        <HeroCanvas paused={paused} />
        <div className={s.demoFooter}>
          <span>Explore the creative canvas</span>
          <button
            aria-label={paused ? "Play animations" : "Pause animations"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </section>
      <section className={s.trust}>
        <p>ONE CREATIVE SPACE. EVERY KIND OF STORY.</p>
        <div className={s.marquee}>
          {[0, 1].map((n) => (
            <div key={n} aria-hidden={n === 1}>
              {[
                "YouTube",
                "Shorts",
                "Podcasts",
                "Instagram",
                "Masterclasses",
                "Documentaries",
                "Reels",
                "Films",
              ].map((x, i) => (
                <span key={x}>
                  {i % 3 === 0 ? <Film /> : i % 3 === 1 ? <Play /> : <Layers />}
                  {x}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>
      <div className={s.sectionTitle} id="agent">
        <h2>
          frame. <span className={s.agentSymbol}>✺</span> Agent
        </h2>
      </div>
      <Stage length={230}>
        <Copy
          title="Your AI editing partner"
          text="Bring the vision. Shape the cut. Start with your footage, find the moments that matter, and refine your edit in a single workspace. Keep your original, explore new directions, and make every frame your own."
          action="Try frame. Agent"
        />
        <AgentDemo />
      </Stage>
      <div className={s.sectionTitle} id="creators">
        <h2>Built for Creators</h2>
      </div>
      <Stage id="cinematic" length={170}>
        <Copy
          title="A cinematic point of view"
          text="Find the look that brings your story to life. Explore the language of cameras and lenses, then carry that creative direction into your next cinematic edit."
          action="Create a cinematic edit"
          href="/studio?mode=inspirational"
        />
        <LensDemo paused={paused} />
      </Stage>
      <Stage reverse length={170}>
        <Copy
          title="A new angle on every story"
          text="Explore perspective, composition, and scale. Make room for the details, draw attention to your subject, and find a frame that feels right."
          action="Explore social edits"
          href="/studio?mode=social"
        />
        <AngleDemo paused={paused} />
      </Stage>
      <Stage length={190}>
        <Copy
          title="Shape the light. Set the mood."
          text="See how warmth, brightness, and the direction of light change an image. Explore the possibilities in this interactive lighting study, from a soft glow to a dramatic finish."
          action="Start your next edit"
        />
        <LightDemo paused={paused} />
      </Stage>
      <Stage reverse length={200}>
        <Copy
          title="Reimagine what’s in the frame"
          text="One scene, another possibility. Explore a visual concept for changing a subject while keeping the rhythm of the shot. A glimpse of where creative video tools can take your ideas."
          action="Explore cinematic editing"
          href="/studio?mode=inspirational"
        />
        <ReplaceDemo paused={paused} />
      </Stage>
      <Stage id="possibilities" length={155}>
        <Copy
          title="A whole world of possibilities"
          text="Talking heads, memorable short clips, cinematic stories, or your next course. Start with the footage you have and choose the direction you want to take."
          action="Find your workflow"
        />
        <div className={`${s.demo} ${s.modelsDemo}`}>
          <Picture
            name="models.webp"
            alt="A collage of cinematic creative possibilities"
          />
          <div className={s.modelPills}>
            {[
              "Talking head",
              "Cinematic",
              "Long-form clips",
              "Courses & YouTube",
              "Talking head",
              "Cinematic",
              "Long-form clips",
              "Courses & YouTube",
            ].map((x, i) => (
              <Link
                href={`/studio?mode=${["social", "inspirational", "clips", "course"][i % 4]}`}
                key={i}
              >
                <Sparkles size={15} />
                {x}
              </Link>
            ))}
          </div>
        </div>
      </Stage>
      <div className={s.sectionTitle}>
        <h2>frame. Creative Space</h2>
      </div>
      <Stage length={200}>
        <Copy
          title="Find your next creative direction"
          text="Great work starts with an idea. Explore visual connections, map the flow of your story, and bring your own footage into the studio to make something that feels like you."
          action="Create your project"
        />
        <div className={`${s.demo} ${s.communityDemo}`}>
          <Picture
            name="comm.webp"
            alt="An interconnected storyboard of cinematic scenes"
          />
          <Link href="/studio" className={s.clone}>
            Create project <ArrowUpRight size={16} />
          </Link>
          <div className={s.galleryTiles}>
            {[0, 1, 2].map((n) => (
              <Picture key={n} name={`node-${n}.webp`} />
            ))}
          </div>
        </div>
      </Stage>
      <section id="start" className={s.finalCta}>
        <h2>Try frame.</h2>
        <CTA />
      </section>
    </main>
  );
}

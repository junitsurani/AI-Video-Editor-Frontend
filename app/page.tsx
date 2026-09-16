"use client";

/* eslint-disable @next/next/no-img-element -- Product screenshots are static JPEGs. */

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
  ChevronDown,
  Plus,
  Minus,
  Maximize,
  Menu,
  X,
  Play,
  Pause,
  Sparkles,
  Film,
  Layers,
  Check,
  Captions,
  Scissors,
  BookOpen,
} from "lucide-react";
import s from "./landing.module.css";

const shots = {
  home: "/product/studio-home.jpg",
  upload: "/product/studio-upload.jpg",
  editor: "/product/studio-editor.jpg",
  cinematicEditor: "/product/studio-cinematic.jpg",
  social: "/product/mode-social.jpg",
  cinematic: "/product/mode-cinematic.jpg",
  clips: "/product/mode-clips.jpg",
  course: "/product/mode-course.jpg",
};

function Picture({
  src,
  alt = "",
  className = "",
  style,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src}
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
function HeroCanvas() {
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
                -120,
                Math.min(120, drag.current.ox + e.clientX - drag.current.x),
              ),
              y: Math.max(
                -80,
                Math.min(80, drag.current.oy + e.clientY - drag.current.y),
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
            Workspace <ChevronDown size={12} />
          </span>
        </div>
        <Picture
          src={shots.home}
          alt="Frame studio workspace with upload area and four editing modes"
          className={s.productHero}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          }}
        />
        <div className={s.canvasHint}>Drag to explore the workspace</div>
        <div className={s.canvasZoom}>
          <button
            aria-label="Zoom out"
            onClick={() => setZoom((v) => Math.max(0.8, v - 0.1))}
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
      <Picture
        src={shots.cinematicEditor}
        alt="Frame cinematic project editor with a 9:16 preview"
        className={s.productBackdrop}
      />
      <div className={s.chat}>
        <div className={s.chatHeader}>
          <Sparkles size={16} /> First cut <Plus size={15} />
        </div>
        <div className={s.chatBody}>
          <div className={s.bubble}>
            <Picture src={shots.upload} alt="" />
            Upload talking-head footage and make a vertical social edit with
            captions.
          </div>
          <div className={s.agentResponse}>
            <span className={s.thought}>
              <Check size={12} /> Edit direction ready
            </span>
            <p>
              We’ll transcribe, trim long pauses, frame for 9:16, and burn in
              timed captions. Your original stays untouched.
            </p>
            <div className={s.sceneTable}>
              <span>Step</span>
              <span>In studio</span>
              {[
                ["Upload", "MP4 or MOV into a project"],
                ["First cut", "Silence, captions, framing"],
                ["Revise", "Prompt, transcript, export"],
              ].map(([step, detail]) => (
                <div key={step}>
                  <span>{step}</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Link href="/studio" className={s.promptBox}>
          Open the workspace and start with your footage…
          <span>
            <Plus size={15} />
            <ArrowUp size={16} />
          </span>
        </Link>
      </div>
    </div>
  );
}
function ProductDemo({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className={`${s.demo} ${s.productDemo}`}>
      <Picture src={src} alt={alt} className={s.productShot} />
      <span className={s.concept}>{label}</span>
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
            Workspace
          </a>
          <Link href="/login">Sign in</Link>
          <a href="#modes" onClick={() => setMenu(false)}>
            Editing modes
          </a>
          <Link href="/studio">Studio</Link>
          <a href="#start" onClick={() => setMenu(false)}>
            Get started
          </a>
        </nav>
        <div className={s.headerActions}>
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
          <h1>Your AI editing studio</h1>
          <p>
            frame. turns a single upload into a social cut, a cinematic pass,
            course cleanup, or ranked clips.
            <br className={s.desktopBreak} /> Same workspace you use after sign
            in — not a separate marketing canvas.
          </p>
          <div className={s.heroActions}>
            <CTA />
            <CTA href="/studio" dark>
              Open the workspace
            </CTA>
          </div>
        </div>
        <HeroCanvas />
        <div className={s.demoFooter}>
          <span>The Frame studio, captured from the live dashboard</span>
          <button
            aria-label={paused ? "Play animations" : "Pause animations"}
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        </div>
      </section>
      <section className={s.trust}>
        <p>ONE WORKSPACE. FOUR KINDS OF EDIT.</p>
        <div className={s.marquee}>
          {[0, 1].map((n) => (
            <div key={n} aria-hidden={n === 1}>
              {[
                "Social",
                "Cinematic",
                "Clips",
                "Courses",
                "Captions",
                "Transcript",
                "Export",
                "History",
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
          frame. <span className={s.agentSymbol}>✺</span> Studio
        </h2>
      </div>
      <Stage length={230}>
        <Copy
          title="Upload once. Shape the cut here."
          text="Bring footage into a project, choose a mode, then generate a first cut. Review the preview, correct the transcript, and export 1080p without overwriting the original."
          action="Open studio"
          href="/studio"
        />
        <AgentDemo />
      </Stage>
      <div className={s.sectionTitle} id="modes">
        <h2>Four editing modes</h2>
      </div>
      <Stage id="social" length={170}>
        <Copy
          title="Social edit"
          text="Portrait output, timed captions, tighter pacing, and conservative punch-ins. Built for talking heads, Reels, and Shorts."
          action="Start a social edit"
          href="/studio?mode=social"
        />
        <ProductDemo
          src={shots.social}
          alt="Talking-head studio still for a social edit"
          label="Social · 9:16 talking head"
        />
      </Stage>
      <Stage reverse length={170}>
        <Copy
          title="Cinematic edit"
          text="Keep more of the performance. Apply a cinematic look, fades, and music mixing when you want atmosphere more than aggressive silence cuts."
          action="Start a cinematic edit"
          href="/studio?mode=inspirational"
        />
        <ProductDemo
          src={shots.cinematic}
          alt="Coastal mountain road at dusk for a cinematic edit"
          label="Cinematic · atmosphere and motion"
        />
      </Stage>
      <Stage length={170}>
        <Copy
          title="Long-form to clips"
          text="Analyze a longer recording, rank standalone highlights, then style the ones you keep. Needs enough source duration for 20–90 second candidates."
          action="Find clips"
          href="/studio?mode=clips"
        />
        <ProductDemo
          src={shots.clips}
          alt="Two-person interview still for long-form clip finding"
          label="Clips · find the moments"
        />
      </Stage>
      <Stage reverse length={170}>
        <Copy
          title="Courses & YouTube"
          text="Landscape-first cleanup: remove dead air, level audio, and keep the lesson readable. Dedicated screen/face switching is still a later engine."
          action="Start a course edit"
          href="/studio?mode=course"
        />
        <ProductDemo
          src={shots.course}
          alt="Instructor at a desk for course and YouTube cleanup"
          label="Courses · landscape lesson"
        />
      </Stage>
      <Stage id="possibilities" length={155}>
        <Copy
          title="Start from the mode you need"
          text="Every card on the dashboard opens the same upload flow with a different default: captions and 9:16, cinematic grade, highlight search, or lesson cleanup."
          action="Go to studio"
          href="/studio"
        />
        <div className={`${s.demo} ${s.modelsDemo}`}>
          <div className={s.modeGrid}>
            <Picture src={shots.social} alt="Social edit" />
            <Picture src={shots.cinematic} alt="Cinematic edit" />
            <Picture src={shots.clips} alt="Long-form clips" />
            <Picture src={shots.course} alt="Courses and YouTube" />
          </div>
          <div className={s.modelPills}>
            {[
              { href: "/studio?mode=social", label: "Social edit", Icon: Captions },
              {
                href: "/studio?mode=inspirational",
                label: "Cinematic edit",
                Icon: Film,
              },
              { href: "/studio?mode=clips", label: "Long-form clips", Icon: Scissors },
              { href: "/studio?mode=course", label: "Courses & YouTube", Icon: BookOpen },
            ]
              .concat([
                { href: "/studio?mode=social", label: "Social edit", Icon: Captions },
                {
                  href: "/studio?mode=inspirational",
                  label: "Cinematic edit",
                  Icon: Film,
                },
                { href: "/studio?mode=clips", label: "Long-form clips", Icon: Scissors },
                { href: "/studio?mode=course", label: "Courses & YouTube", Icon: BookOpen },
              ])
              .map((x, i) => (
                <Link href={x.href} key={`${x.label}-${i}`}>
                  <x.Icon size={15} />
                  {x.label}
                </Link>
              ))}
          </div>
        </div>
      </Stage>
      <div className={s.sectionTitle}>
        <h2>frame. Creative Space</h2>
      </div>
      <Stage length={180}>
        <Copy
          title="Projects live where you left them"
          text="Recent projects, status, duration, and mode sit on the same dashboard. Open a project to preview, revise from a prompt, or export."
          action="View workspace"
          href="/studio"
        />
        <div className={`${s.demo} ${s.communityDemo}`}>
          <Picture
            src={shots.editor}
            alt="Frame social project editor with a 9:16 boxing preview"
          />
          <Link href="/studio" className={s.clone}>
            Create project <ArrowUpRight size={16} />
          </Link>
        </div>
      </Stage>
      <section id="start" className={s.finalCta}>
        <h2>Try frame.</h2>
        <CTA />
      </section>
    </main>
  );
}

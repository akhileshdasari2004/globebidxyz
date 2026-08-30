"use client";

import { Canvas, ThreeEvent, useFrame } from "@react-three/fiber";
import { Billboard, Html, Line, OrbitControls } from "@react-three/drei";
import { feature, mesh } from "topojson-client";
import atlas from "world-atlas/countries-110m.json";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import * as THREE from "three";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CountryState } from "@/lib/types";

countries.registerLocale(en);
type Ring = number[][];
type Tier = "mobile" | "desktop";
type GeoFeature = { id?: string | number; properties: { name?: string }; geometry: { type: string; coordinates: unknown } };
const geo = feature(atlas as never, (atlas as unknown as { objects: { countries: never } }).objects.countries) as unknown as { features: GeoFeature[] };

function numericToCodes(id: string | number | undefined) {
  const numeric = String(id ?? "").padStart(3, "0");
  const iso2 = countries.numericToAlpha2(numeric) || "";
  return { iso2, iso3: countries.alpha2ToAlpha3(iso2) || "" };
}
export const countryFeatures = geo.features.map((f) => ({ ...f, ...numericToCodes(f.id), name: f.properties.name || "Unknown" })).filter((f) => f.iso3);

function xyz(lng: number, lat: number, radius = 2.02) {
  const phi = THREE.MathUtils.degToRad(90 - lat); const theta = THREE.MathUtils.degToRad(lng + 180);
  return new THREE.Vector3(-radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta));
}
function eachRing(f: (typeof countryFeatures)[number]): Ring[] {
  const c = f.geometry.coordinates as number[][][] | number[][][][];
  return f.geometry.type === "Polygon" ? (c as number[][][]) : (c as number[][][][]).flat();
}
function insideRing(lng: number, lat: number, ring: Ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside; }
  return inside;
}
function hitCountry(lng: number, lat: number) { return countryFeatures.find((f) => eachRing(f).some((ring) => insideRing(lng, lat, ring))); }
function eventLngLat(event: ThreeEvent<PointerEvent | MouseEvent>) {
  const p = event.object.worldToLocal(event.point.clone()).normalize();
  return { lat: THREE.MathUtils.radToDeg(Math.asin(p.y)), lng: THREE.MathUtils.radToDeg(Math.atan2(-p.z, p.x)) };
}
function flag(iso2: string) { return iso2.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0))); }

// Only the set of claimed ISO3 codes affects the drawn texture (fill color), so callers should
// key the memo on this cheap derived string instead of the full `states` object — that keeps
// benign realtime updates (stake amount changes on an already-claimed country, unrelated country
// edits) from forcing an expensive canvas repaint + GPU re-upload.
function claimedSetKey(states: Record<string, CountryState>) {
  const claimed: string[] = [];
  for (const iso3 in states) if (Number(states[iso3]?.current_stake) > 0) claimed.push(iso3);
  return claimed.sort().join(",");
}

function makeEarthTexture(states: Record<string, CountryState>, tier: Tier) {
  const canvas = document.createElement("canvas"); canvas.width = tier === "mobile" ? 2048 : 4096; canvas.height = tier === "mobile" ? 1024 : 2048; const ctx = canvas.getContext("2d")!;
  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height); ocean.addColorStop(0, "#194f82"); ocean.addColorStop(.45, "#1674aa"); ocean.addColorStop(.58, "#12699f"); ocean.addColorStop(1, "#123f70"); ctx.fillStyle = ocean; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const oceanTile = document.createElement("canvas"); oceanTile.width = 160; oceanTile.height = 160; const oceanCtx = oceanTile.getContext("2d")!; let oceanSeed = 91; const oceanRandom = () => (oceanSeed = (oceanSeed * 48271) % 2147483647) / 2147483647;
  for (let i = 0; i < 950; i++) { const alpha = .025 + oceanRandom() * .07; oceanCtx.fillStyle = oceanRandom() > .48 ? `rgba(205,235,244,${alpha})` : `rgba(2,44,78,${alpha})`; const size = .6 + oceanRandom() * 1.8; oceanCtx.beginPath(); oceanCtx.arc(oceanRandom() * 160, oceanRandom() * 160, size, 0, Math.PI * 2); oceanCtx.fill(); }
  oceanCtx.strokeStyle = "rgba(210,239,246,.075)"; oceanCtx.lineWidth = 1; for (let y = 18; y < 160; y += 28) { oceanCtx.beginPath(); oceanCtx.moveTo(-8, y); oceanCtx.bezierCurveTo(35, y - 6, 82, y + 8, 168, y - 2); oceanCtx.stroke(); }
  const oceanPattern = ctx.createPattern(oceanTile, "repeat"); if (oceanPattern) { ctx.fillStyle = oceanPattern; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.strokeStyle = "rgba(190,225,238,.09)"; ctx.lineWidth = 2; for (let y = 80; y < canvas.height; y += 74) { ctx.beginPath(); for (let x = 0; x <= canvas.width; x += 32) { const waveY = y + Math.sin(x * .008 + y * .015) * 8; if (x) ctx.lineTo(x, waveY); else ctx.moveTo(x, waveY); } ctx.stroke(); }
  const grain = document.createElement("canvas"); grain.width = 96; grain.height = 96; const grainCtx = grain.getContext("2d")!; let seed = 43; const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647; for (let i = 0; i < 420; i++) { const shade = random() > .5 ? "rgba(13,67,31,.15)" : "rgba(230,220,146,.13)"; grainCtx.fillStyle = shade; const size = 1 + random() * 2.2; grainCtx.fillRect(random() * 96, random() * 96, size, size); } const landGrain = ctx.createPattern(grain, "repeat");
  const land = ctx.createLinearGradient(0, 0, 0, canvas.height); land.addColorStop(0, "#6f9552"); land.addColorStop(.3, "#4f8b47"); land.addColorStop(.52, "#2f7f43"); land.addColorStop(.72, "#5f914b"); land.addColorStop(1, "#719453");
  countryFeatures.forEach((country) => { const claimed = Number(states[country.iso3]?.current_stake || 0) > 0; for (const ring of eachRing(country)) { ctx.beginPath(); let lastX = 0; ring.forEach(([lng, lat], i) => { let x = ((lng + 180) / 360) * canvas.width; const y = ((90 - lat) / 180) * canvas.height; if (i && Math.abs(x - lastX) > canvas.width / 2) x += x < lastX ? canvas.width : -canvas.width; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); lastX = x; }); ctx.closePath(); ctx.fillStyle = claimed ? "#55a85c" : land; ctx.fill(); if (landGrain) { ctx.save(); ctx.clip(); ctx.fillStyle = landGrain; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.restore(); } ctx.strokeStyle = "rgba(5,22,12,.82)"; ctx.lineWidth = 1.55; ctx.lineJoin = "round"; ctx.stroke(); } });
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = tier === "mobile" ? 4 : 8; texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter; texture.generateMipmaps = true; return texture;
}

// drei/R3F's useTexture is suspense-based: on a *rejected* load it doesn't throw synchronously
// during render (only the pending promise does, for Suspense to catch) — the rejection surfaces
// as a genuine unhandled promise rejection at the browser level, which no React Error Boundary
// can catch. A single deleted/unreachable logo URL would otherwise spam the console forever.
// Loading the texture manually with THREE's own onError callback sidesteps that entirely: a
// failure just leaves the texture unset and the pin renders nothing, instead of a logo.
function useSafeTexture(url: string): THREE.Texture | null {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let cancelled = false; let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().load(url, (t) => { if (cancelled) { t.dispose(); return; } t.colorSpace = THREE.SRGBColorSpace; loaded = t; setTexture(t); }, undefined, () => { if (!cancelled) console.warn("Brand logo failed to load, skipping pin:", url); });
    return () => { cancelled = true; loaded?.dispose(); };
  }, [url]);
  return texture;
}

function BrandPin({ state, onBrandClick }: { state: CountryState; onBrandClick: (countryCode: string) => void }) {
  const texture = useSafeTexture(state.brand!.logo_url);
  if (!texture) return null;
  return <group position={xyz(state.centroid_lng, state.centroid_lat, 2.13)} onClick={(event) => { event.stopPropagation(); onBrandClick(state.iso3); }}><Billboard><mesh><circleGeometry args={[.105, 32]} /><meshBasicMaterial map={texture} transparent toneMapped={false} /></mesh></Billboard></group>;
}

function Earth({ states, selected, focusRequest, onSelect, onBrandClick, tier }: { states: Record<string, CountryState>; selected?: string; focusRequest: number; onSelect: (iso3: string) => void; onBrandClick: (iso3: string) => void; tier: Tier }) {
  const group = useRef<THREE.Group>(null); const [active, setActive] = useState(false); const [hover, setHover] = useState<{ iso3: string; point: THREE.Vector3 }>(); const idle = useRef(0); const dragging = useRef(false);
  // Recompute the (expensive) canvas texture only when the set of claimed countries actually
  // changes, never on unrelated realtime pushes or on every country selection.
  const claimedKey = useMemo(() => claimedSetKey(states), [states]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `states` is read inside, but only `claimedKey`/`tier` should invalidate the cached texture.
  const earthTexture = useMemo(() => makeEarthTexture(states, tier), [claimedKey, tier]);
  useEffect(() => () => earthTexture.dispose(), [earthTexture]);
  // All border segments merged into a single BufferGeometry so the whole coastline/border network
  // is one draw call instead of one per line string (topojson can return hundreds of them).
  const borderGeometry = useMemo(() => {
    const m = mesh(atlas as never, (atlas as unknown as { objects: { countries: never } }).objects.countries) as unknown as { coordinates: number[][][] };
    const positions: number[] = [];
    for (const line of m.coordinates) for (let i = 0; i < line.length - 1; i++) { const a = xyz(line[i][0], line[i][1], 2.01); const b = xyz(line[i + 1][0], line[i + 1][1], 2.01); positions.push(a.x, a.y, a.z, b.x, b.y, b.z); }
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); return geometry;
  }, []);
  useEffect(() => () => borderGeometry.dispose(), [borderGeometry]);
  const selectedLines = useMemo(() => { const f = countryFeatures.find((x) => x.iso3 === selected); return f ? eachRing(f).map((ring) => ring.map(([lng, lat]) => xyz(lng, lat, 2.045))) : []; }, [selected]);
  // Auto-focus: when the selection changes, rotate the globe so that country's centroid faces the
  // camera. The target quaternion is a ref, not state — the actual rotation happens frame-by-frame in
  // useFrame below, exactly like the idle auto-rotate it temporarily takes over from. Depending on
  // the primitive lat/lng (not the whole `states` object) means this only re-fires when this
  // country's real position actually changes — including the moment it arrives, replacing the
  // (0,0) placeholder a URL-preselected country starts with before the initial fetch resolves —
  // and never on unrelated realtime churn elsewhere on the globe.
  const focusTarget = useRef<{ rotation: THREE.Quaternion; distance: number } | null>(null);
  const selectedCountry = selected ? states[selected] : undefined;
  const focusLat = selectedCountry?.centroid_lat; const focusLng = selectedCountry?.centroid_lng;
  useEffect(() => {
    if (!selected || focusLat == null || focusLng == null || (focusLat === 0 && focusLng === 0)) { focusTarget.current = null; return; }
    const countryDirection = xyz(focusLng, focusLat, 1).normalize();
    // Leave clean visual space for the detail panel: left on desktop and above the bottom sheet
    // on mobile. The modest camera distance gives a gentle zoom without cropping large countries.
    const visibleCenter = new THREE.Vector3(tier === "desktop" ? -.34 : 0, tier === "mobile" ? .3 : .03, 1).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(countryDirection, visibleCenter);
    // setFromUnitVectors chooses the shortest rotation but does not preserve a map's visual
    // "north-up" orientation. Correct its twist around the focused country direction so labels,
    // borders, and the landmass never settle upside down after an animated focus.
    const latitude = THREE.MathUtils.degToRad(focusLat); const longitude = THREE.MathUtils.degToRad(focusLng);
    const localNorth = new THREE.Vector3(-Math.sin(latitude) * Math.cos(longitude), Math.cos(latitude), Math.sin(latitude) * Math.sin(longitude));
    const focusedNorth = localNorth.applyQuaternion(rotation).projectOnPlane(visibleCenter).normalize();
    const screenUp = new THREE.Vector3(0, 1, 0).projectOnPlane(visibleCenter).normalize();
    const twistAngle = Math.atan2(visibleCenter.dot(focusedNorth.clone().cross(screenUp)), focusedNorth.dot(screenUp));
    rotation.premultiply(new THREE.Quaternion().setFromAxisAngle(visibleCenter, twistAngle));
    focusTarget.current = { rotation, distance: tier === "mobile" ? 4.7 : 4.45 };
  }, [selected, focusLat, focusLng, focusRequest, tier]);
  useFrame(({ camera }, delta) => {
    idle.current += delta;
    if (!group.current) return;
    if (focusTarget.current !== null) {
      const ease = 1 - Math.exp(-delta * 3.8);
      group.current.quaternion.slerp(focusTarget.current.rotation, ease);
      camera.position.setLength(THREE.MathUtils.lerp(camera.position.length(), focusTarget.current.distance, ease));
      if (group.current.quaternion.angleTo(focusTarget.current.rotation) < 0.002 && Math.abs(camera.position.length() - focusTarget.current.distance) < .005) { group.current.quaternion.copy(focusTarget.current.rotation); camera.position.setLength(focusTarget.current.distance); focusTarget.current = null; }
      idle.current = 0;
    } else if (!active && idle.current > 1.5) group.current.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), delta * .035);
  });
  function interact() { dragging.current = true; setActive(true); setHover(undefined); idle.current = 0; window.setTimeout(() => setActive(false), 7000); }
  function pick(e: ThreeEvent<MouseEvent>) { e.stopPropagation(); const { lng, lat } = eventLngLat(e); const country = hitCountry(((lng + 540) % 360) - 180, lat); if (country) onSelect(country.iso3); }
  function move(e: ThreeEvent<PointerEvent>) { idle.current = 0; if (dragging.current) return; const { lng, lat } = eventLngLat(e); const country = hitCountry(((lng + 540) % 360) - 180, lat); if (!country) return setHover(undefined); const point = e.object.worldToLocal(e.point.clone()).normalize().multiplyScalar(2.18); setHover((old) => old?.iso3 === country.iso3 && old.point.distanceTo(point) < .03 ? old : { iso3: country.iso3, point }); }
  useEffect(() => { const stop = () => { dragging.current = false; }; window.addEventListener("pointerup", stop); window.addEventListener("pointercancel", stop); return () => { window.removeEventListener("pointerup", stop); window.removeEventListener("pointercancel", stop); }; }, []);
  const segments = tier === "mobile" ? ([96, 68] as const) : ([140, 100] as const);
  return <>
    <ambientLight intensity={1.45} /><directionalLight position={[-4, 5, 6]} intensity={1.8} />
    <group ref={group}>
      <mesh onClick={pick} onPointerDown={interact} onPointerMove={move} onPointerOut={() => setHover(undefined)}>
        <sphereGeometry args={[2, segments[0], segments[1]]} /><meshStandardMaterial map={earthTexture} roughness={.92} metalness={0} />
      </mesh>
      <lineSegments geometry={borderGeometry}><lineBasicMaterial color="#171915" transparent opacity={.78} /></lineSegments>
      {selectedLines.map((points, i) => <Line key={`lift${i}`} points={points} color="#f5f0d8" transparent opacity={.75} lineWidth={4.2} />)}
      {selectedLines.map((points, i) => <Line key={`s${i}`} points={points} color="#101710" transparent opacity={1} lineWidth={2.2} />)}
      {Object.values(states).filter((s) => s.brand?.logo_url).map((s) => <BrandPin key={s.iso3} state={s} onBrandClick={onBrandClick} />)}
      {hover && hover.iso3 !== selected && <Html position={hover.point} center zIndexRange={[12, 0]}><div className="pointer-events-none whitespace-nowrap rounded-2xl border border-black/8 bg-white/90 px-3 py-2 text-xs text-ink shadow-xl backdrop-blur-xl"><span className="mr-2">{flag(states[hover.iso3]?.iso2 || "")}</span>{states[hover.iso3]?.name || hover.iso3}<span className="ml-2 text-black/45">{formatHover(states[hover.iso3])}</span></div></Html>}
    </group>
    <OrbitControls enablePan={false} minDistance={3.95} maxDistance={8} minPolarAngle={.42} maxPolarAngle={Math.PI - .42} rotateSpeed={.5} zoomSpeed={.65} onStart={interact} />
  </>;
}

function formatHover(state?: CountryState) { if (!state?.current_stake) return "Unclaimed · $5"; return `${state.brand?.name || "Claimed"} · $${Number(state.current_stake).toLocaleString()}`; }

function useDeviceTier(): Tier {
  const [tier] = useState<Tier>(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop"));
  return tier;
}

export function GlobeScene(props: { states: Record<string, CountryState>; selected?: string; focusRequest: number; onSelect: (iso3: string) => void; onInteract: (type: "rotate" | "zoom" | "touch") => void; onBrandClick: (iso3: string) => void }) {
  const tier = useDeviceTier();
  const dpr = useMemo<[number, number]>(() => (tier === "mobile" ? [1, 1.5] : [1, 1.75]), [tier]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Stop the R3F render loop (and auto-rotation) entirely while the globe is scrolled out of view —
  // e.g. while reading the FAQ or footer — and resume as soon as it's back on screen.
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const el = containerRef.current; if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.05 });
    observer.observe(el); return () => observer.disconnect();
  }, []);
  // If the GPU context drops (driver reset, backgrounding on some mobile browsers, tab discard),
  // calling preventDefault() on the loss event is what actually allows the browser to restore it —
  // otherwise the loss can be permanent for that canvas. Three/R3F rebuild GPU resources
  // automatically on "restored"; frameloop just needs to already be running, which it is.
  function handleCreated({ gl }: { gl: THREE.WebGLRenderer }) {
    const canvas = gl.domElement;
    const onLost = (e: Event) => { e.preventDefault(); console.warn("WebGL context lost — will attempt to restore automatically"); };
    const onRestored = () => console.info("WebGL context restored");
    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
  }
  return <div ref={containerRef} className="h-full w-full" onPointerDown={(event) => props.onInteract(event.pointerType === "touch" ? "touch" : "rotate")} onWheel={() => props.onInteract("zoom")}><Canvas flat frameloop={visible ? "always" : "never"} dpr={dpr} camera={{ position: [0, 0, 4.75], fov: 40 }} gl={{ antialias: true, alpha: true, powerPreference: "high-performance", precision: "highp" }} onCreated={handleCreated}><Earth {...props} tier={tier} /></Canvas></div>;
}
export { flag };

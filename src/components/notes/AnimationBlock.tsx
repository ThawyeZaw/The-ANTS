'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — AnimationBlock
// Predefined interactive CSS/JS animations for visual learning,
// plus custom script rendering for AI/user-generated canvas animations.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import type { AnimationTemplate } from '@/types';

interface AnimationBlockProps {
  template?: AnimationTemplate;
  config?: Record<string, string | number | boolean>;
  script?: string;
  caption?: string;
}

// ── Animation registry — label & description for each template ────────────────

export const ANIMATION_TEMPLATES: Record<AnimationTemplate, { label: string; subject: string; description: string }> = {
  pendulum:          { label: 'Pendulum',           subject: 'Physics',   description: 'Simple harmonic motion of a pendulum' },
  wave_motion:       { label: 'Wave Motion',         subject: 'Physics',   description: 'Transverse wave propagation' },
  projectile:        { label: 'Projectile Motion',   subject: 'Physics',   description: 'Trajectory of a projectile' },
  cell_division:     { label: 'Cell Division',       subject: 'Biology',   description: 'Mitosis stages animation' },
  lens_refraction:   { label: 'Lens Refraction',     subject: 'Physics',   description: 'Converging/diverging lens ray diagram' },
  circuit_dc:        { label: 'DC Circuit',          subject: 'Physics',   description: 'Current flow in a simple DC circuit' },
  dna_helix:         { label: 'DNA Double Helix',    subject: 'Biology',   description: 'Rotating DNA double helix structure' },
  gas_particles:     { label: 'Gas Particles',       subject: 'Chemistry', description: 'Kinetic theory: gas molecules in motion' },
  titration:         { label: 'Titration Curve',     subject: 'Chemistry', description: 'pH change during acid-base titration' },
  spring_oscillation:{ label: 'Spring Oscillation',  subject: 'Physics',   description: 'Mass-spring system oscillation' },
};

// ── Individual animation renderers ────────────────────────────────────────────

function PendulumAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const angleRef = useRef(Math.PI / 4);
  const omegaRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const g = 9.8, L = 130, dt = 0.016;
    const pivotX = canvas.width / 2, pivotY = 30;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Physics
      const alpha = -(g / L) * Math.sin(angleRef.current);
      omegaRef.current += alpha * dt;
      omegaRef.current *= 0.999; // tiny damping
      angleRef.current += omegaRef.current * dt;

      const bobX = pivotX + L * Math.sin(angleRef.current);
      const bobY = pivotY + L * Math.cos(angleRef.current);

      // Pivot
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();

      // Rod
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 16, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(bobX - 4, bobY - 4, 2, bobX, bobY, 16);
      grad.addColorStop(0, '#a78bfa');
      grad.addColorStop(1, '#6366f1');
      ctx.fillStyle = grad;
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={280} height={200} className="w-full max-w-xs" />;
}

function WaveAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tRef.current += 0.05;

      const midY = canvas.height / 2;
      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const y = midY + 40 * Math.sin((x / 30) - tRef.current);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dashed centre line
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(canvas.width, midY);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={320} height={160} className="w-full max-w-sm" />;
}

function GasParticlesAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [speed, setSpeed] = useState(1.5);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number }[]>([]);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    particlesRef.current = Array.from({ length: 30 }, () => ({
      x: Math.random() * 280,
      y: Math.random() * 160,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((p) => {
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        if (p.x < 4 || p.x > canvas.width - 4) p.vx *= -1;
        if (p.y < 4 || p.y > canvas.height - 4) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed]);

  return (
    <div className="flex flex-col gap-2">
      <canvas ref={canvasRef} width={320} height={180} className="w-full max-w-sm rounded-lg bg-slate-900" />
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <span>Temp:</span>
        <input
          type="range" min={0.5} max={4} step={0.1} value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          className="flex-1 accent-emerald-500 cursor-pointer"
        />
        <span>{speed.toFixed(1)}x</span>
      </div>
    </div>
  );
}

function DnaHelixAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24'];

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tRef.current += 0.03;

      const cx = canvas.width / 2;
      const steps = 20;

      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const y = progress * canvas.height;
        const phase = tRef.current + progress * Math.PI * 4;
        const x1 = cx + 60 * Math.cos(phase);
        const x2 = cx + 60 * Math.cos(phase + Math.PI);
        const depth = Math.sin(phase);

        // Cross-link
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.strokeStyle = `rgba(148,163,184,${0.3 + 0.3 * Math.abs(depth)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Base pairs
        const r = 7;
        ctx.beginPath();
        ctx.arc(x1, y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % 2 === 0 ? 0 : 1];
        ctx.globalAlpha = 0.7 + 0.3 * depth;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x2, y, r, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % 2 === 0 ? 2 : 3];
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={280} height={220} className="w-full max-w-xs" />;
}

function SpringOscillationAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      tRef.current += 0.04;

      const midX = canvas.width / 2;
      const amplitude = 80;
      const bobX = midX + amplitude * Math.cos(tRef.current);
      const wallX = 10;
      const bobY = canvas.height / 2;

      // Wall
      ctx.fillStyle = '#475569';
      ctx.fillRect(wallX, bobY - 30, 6, 60);

      // Spring (zigzag)
      const segments = 12;
      const springEnd = bobX - 20;
      const segW = (springEnd - wallX - 6) / segments;
      ctx.beginPath();
      ctx.moveTo(wallX + 6, bobY);
      for (let i = 0; i < segments; i++) {
        const x = wallX + 6 + i * segW + segW / 2;
        const y = bobY + (i % 2 === 0 ? -14 : 14);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(springEnd, bobY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Bob
      ctx.beginPath();
      ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(bobX - 5, bobY - 5, 2, bobX, bobY, 18);
      grad.addColorStop(0, '#fb923c');
      grad.addColorStop(1, '#ef4444');
      ctx.fillStyle = grad;
      ctx.fill();

      // Equilibrium dashed line
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(midX, bobY - 25);
      ctx.lineTo(midX, bobY + 25);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]);

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return <canvas ref={canvasRef} width={320} height={160} className="w-full max-w-sm" />;
}

// ── Custom script animation (for AI/user-generated canvas code) ───────────────

function CustomScriptAnimation({ script, caption }: { script: string; caption?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Build a sandboxed HTML page with the canvas and embedded script
    const html = `<!DOCTYPE html>
<html>
<head><style>body{margin:0;overflow:hidden;background:#1e293b;}canvas{display:block;width:320px;height:200px;}</style></head>
<body>
<canvas id="canvas" width="320" height="200"></canvas>
<script>
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');
var width = 320;
var height = 200;
// User-generated animation script:
(function() {
  ${script}
})();
<\/script>
</body>
</html>`;

    iframe.srcdoc = html;
  }, [script]);

  return (
    <div className="my-4 flex flex-col items-center gap-2">
      <div className="w-full max-w-sm bg-background-secondary rounded-xl p-4 border border-border overflow-hidden">
        <iframe
          ref={iframeRef}
          title="Custom Animation"
          sandbox="allow-scripts"
          className="w-[320px] h-[200px] mx-auto rounded-lg"
        />
      </div>
      {caption && <p className="text-xs text-foreground-muted text-center max-w-sm italic">{caption}</p>}
    </div>
  );
}

// ── Generic placeholder for templates not yet fully implemented ───────────────

function PlaceholderAnimation({ template }: { template: AnimationTemplate }) {
  const info = ANIMATION_TEMPLATES[template];
  return (
    <div className="flex flex-col items-center justify-center gap-2 h-36 bg-background-secondary rounded-lg border border-dashed border-border text-foreground-muted text-sm">
      <span className="text-2xl">🎬</span>
      <span className="font-medium">{info.label}</span>
      <span className="text-xs opacity-70">{info.description}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AnimationBlock({ template, script, caption }: AnimationBlockProps) {
  // If a custom script is provided, render it instead of a predefined template
  if (script) {
    return <CustomScriptAnimation script={script} caption={caption} />;
  }

  // Otherwise render the selected predefined template
  if (!template) return null;
  const info = ANIMATION_TEMPLATES[template];
  if (!info) return null;

  const renderAnimation = () => {
    switch (template) {
      case 'pendulum':          return <PendulumAnimation />;
      case 'wave_motion':       return <WaveAnimation />;
      case 'gas_particles':     return <GasParticlesAnimation />;
      case 'dna_helix':         return <DnaHelixAnimation />;
      case 'spring_oscillation':return <SpringOscillationAnimation />;
      default:                  return <PlaceholderAnimation template={template} />;
    }
  };

  return (
    <div className="my-4 flex flex-col items-center gap-2">
      <div className="w-full max-w-md bg-background-secondary rounded-xl p-4 border border-border overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {info.subject}
          </span>
          <span className="text-xs text-foreground-muted">{info.label}</span>
        </div>
        <div className="flex justify-center">{renderAnimation()}</div>
      </div>
      {caption && (
        <p className="text-xs text-foreground-muted text-center max-w-sm italic">{caption}</p>
      )}
    </div>
  );
}
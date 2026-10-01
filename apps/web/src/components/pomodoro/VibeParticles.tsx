'use client';

import { useEffect, useRef } from 'react';
import type { ParticleType } from '@/constants/pomodoro-vibes';

interface VibeParticlesProps {
  particleType: ParticleType;
  isActive: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  maxAlpha: number;
  life?: number;
  maxLife?: number;
}

export default function VibeParticles({ particleType, isActive }: VibeParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive || particleType === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const count = particleType === 'rain' ? 80 : particleType === 'dust' ? 45 : 30;

    for (let i = 0; i < count; i++) {
      particles.push(initParticle(particleType, width, height, true));
    }

    function initParticle(type: ParticleType, w: number, h: number, randomY = false): Particle {
      if (type === 'rain') {
        return {
          x: Math.random() * w,
          y: randomY ? Math.random() * h : -20,
          vx: -0.5 - Math.random() * 0.5,
          vy: 8 + Math.random() * 8,
          size: 1.2 + Math.random() * 1.5,
          alpha: 0.15 + Math.random() * 0.35,
          maxAlpha: 0.5,
        };
      } else if (type === 'dust') {
        const maxA = 0.2 + Math.random() * 0.45;
        return {
          x: Math.random() * w,
          y: randomY ? Math.random() * h : h + 10,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.2 - Math.random() * 0.4,
          size: 1 + Math.random() * 2.5,
          alpha: Math.random() * maxA,
          maxAlpha: maxA,
          life: Math.random() * 400,
          maxLife: 300 + Math.random() * 400,
        };
      } else if (type === 'steam') {
        const maxA = 0.12 + Math.random() * 0.2;
        return {
          x: w * 0.4 + (Math.random() - 0.5) * (w * 0.3),
          y: randomY ? Math.random() * h : h + 10,
          vx: (Math.random() - 0.48) * 0.3,
          vy: -0.4 - Math.random() * 0.5,
          size: 3 + Math.random() * 6,
          alpha: 0.02,
          maxAlpha: maxA,
          life: 0,
          maxLife: 250 + Math.random() * 300,
        };
      } else {
        // mist
        return {
          x: Math.random() * w,
          y: randomY ? Math.random() * h : Math.random() * h,
          vx: 0.15 + Math.random() * 0.25,
          vy: (Math.random() - 0.5) * 0.1,
          size: 15 + Math.random() * 30,
          alpha: 0.05 + Math.random() * 0.1,
          maxAlpha: 0.15,
        };
      }
    }

    let isDocumentVisible = true;
    const handleVisibility = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const render = () => {
      if (!isDocumentVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (particleType === 'rain') {
          p.x += p.vx;
          p.y += p.vy;

          ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2.5, p.y + p.vy * 2.5);
          ctx.stroke();

          if (p.y > height + 20 || p.x < -20) {
            particles[i] = initParticle('rain', width, height);
          }
        } else if (particleType === 'dust') {
          p.x += p.vx + Math.sin((p.life || 0) * 0.02) * 0.2;
          p.y += p.vy;
          p.life = (p.life || 0) + 1;

          // Pulse alpha gently
          const progress = (p.life % (p.maxLife || 400)) / (p.maxLife || 400);
          p.alpha = Math.sin(progress * Math.PI) * p.maxAlpha;

          ctx.fillStyle = `rgba(251, 191, 36, ${Math.max(0, p.alpha)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y < -10 || p.life > (p.maxLife || 400)) {
            particles[i] = initParticle('dust', width, height);
          }
        } else if (particleType === 'steam') {
          p.x += p.vx + Math.sin((p.life || 0) * 0.03) * 0.4;
          p.y += p.vy;
          p.size += 0.04;
          p.life = (p.life || 0) + 1;

          const progress = (p.life % (p.maxLife || 300)) / (p.maxLife || 300);
          p.alpha = Math.sin(progress * Math.PI) * p.maxAlpha;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(255, 237, 213, ${p.alpha * 0.6})`);
          grad.addColorStop(1, 'rgba(255, 237, 213, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.y < height * 0.2 || p.life > (p.maxLife || 300)) {
            particles[i] = initParticle('steam', width, height);
          }
        } else if (particleType === 'mist') {
          p.x += p.vx;
          p.y += p.vy;

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(209, 250, 229, ${p.alpha})`);
          grad.addColorStop(1, 'rgba(209, 250, 229, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.x > width + p.size) {
            p.x = -p.size;
            p.y = Math.random() * height;
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [particleType, isActive]);

  if (!isActive || particleType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-70 transition-opacity duration-1000"
      aria-hidden="true"
    />
  );
}

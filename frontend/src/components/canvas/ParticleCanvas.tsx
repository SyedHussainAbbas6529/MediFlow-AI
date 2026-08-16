'use client';

import React, { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Respect user reduced-motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // 1. Medical Cross & Data Particles
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      type: 'cross' | 'dot' | 'pulse';
      color: string;
      alpha: number;
      angle: number;
      va: number;
    }> = [];

    const medicalColors = ['#0EA5E9', '#38BDF8', '#6366F1', '#14B8A6', '#0284C7'];
    const particleCount = Math.min(width > 768 ? 55 : 22, 60);

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 8 + 4,
        type: i % 4 === 0 ? 'cross' : i % 5 === 0 ? 'pulse' : 'dot',
        color: medicalColors[Math.floor(Math.random() * medicalColors.length)],
        alpha: Math.random() * 0.4 + 0.15,
        angle: Math.random() * Math.PI * 2,
        va: (Math.random() - 0.5) * 0.01,
      });
    }

    // 2. ECG Heartbeat Wave state
    let ecgX = 0;
    const ecgSpeed = 2.2;
    const ecgY = height * 0.82;

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Draw single medical cross
    const drawMedicalCross = (x: number, y: number, size: number, color: string, alpha: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      const armWidth = size * 0.32;
      const armLength = size;
      // Vertical arm
      ctx.fillRect(-armWidth / 2, -armLength / 2, armWidth, armLength);
      // Horizontal arm
      ctx.fillRect(-armLength / 2, -armWidth / 2, armLength, armWidth);
      ctx.restore();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle interconnected medical network lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.12 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw Particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        if (p.type === 'cross') {
          drawMedicalCross(p.x, p.y, p.size, p.color, p.alpha, p.angle);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.alpha;
          ctx.shadowBlur = p.type === 'pulse' ? 8 : 0;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw flowing ECG / Heartbeat line across bottom
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.15)';
      ctx.lineWidth = 1.5;

      // Base line
      ctx.moveTo(0, ecgY);
      ctx.lineTo(width, ecgY);
      ctx.stroke();

      // Active glowing ECG wave pulse
      ecgX += ecgSpeed;
      if (ecgX > width + 200) ecgX = -100;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.55)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0EA5E9';

      const pulseStart = ecgX - 90;
      const pulseEnd = ecgX + 90;

      for (let x = Math.max(0, pulseStart); x <= Math.min(width, pulseEnd); x += 2) {
        const offset = x - ecgX;
        let y = ecgY;

        // P-Q-R-S-T heartbeat wave calculation
        if (offset > -40 && offset < -25) {
          // P wave
          y -= Math.sin(((offset + 40) / 15) * Math.PI) * 6;
        } else if (offset >= -20 && offset < -10) {
          // Q dip
          y += 5;
        } else if (offset >= -10 && offset < 5) {
          // R sharp peak
          y -= Math.sin(((offset + 10) / 15) * Math.PI) * 28;
        } else if (offset >= 5 && offset < 15) {
          // S dip
          y += 9;
        } else if (offset >= 25 && offset < 50) {
          // T wave
          y -= Math.sin(((offset - 25) / 25) * Math.PI) * 8;
        }

        if (x === Math.max(0, pulseStart)) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 opacity-80"
    />
  );
}

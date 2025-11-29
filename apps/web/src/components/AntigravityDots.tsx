'use client';

import React, { useRef, useEffect } from 'react';

interface Particle {
  angle: number;
  distance: number;
  size: number;
  speed: number;
  offsetX: number;
  offsetY: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  lengthRatio: number;
  freeX: number;
  freeY: number;
  freeVx: number;
  freeVy: number;
  currentX: number;
  currentY: number;
}

const AntigravityDots = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Use alpha: true for better compositing on macOS
    const ctx = canvas.getContext('2d', { 
      alpha: true,
      desynchronized: true, // Better performance on macOS
      willReadFrequently: false
    });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let time = 0;

    // Mouse state
    const mouse = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      targetX: window.innerWidth / 2,
      targetY: window.innerHeight / 2,
      lastMoveTime: Date.now(),
      isIdle: false,
    };

    const handleResize = () => {
      // Use device pixel ratio for sharper rendering on Retina displays
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
      
      mouse.x = window.innerWidth / 2;
      mouse.y = window.innerHeight / 2;
      mouse.targetX = window.innerWidth / 2;
      mouse.targetY = window.innerHeight / 2;
      initParticles();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.targetX = e.x;
      mouse.targetY = e.y;
      mouse.lastMoveTime = Date.now();
      mouse.isIdle = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouse.targetX = e.touches[0].clientX;
        mouse.targetY = e.touches[0].clientY;
        mouse.lastMoveTime = Date.now();
        mouse.isIdle = false;
      }
    };

    const initParticles = () => {
      particles = [];
      // Detect device type and OS
      const isMobile = window.innerWidth < 768;
      const isMacOS = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
      const isRetina = window.devicePixelRatio > 1;
      
      // Optimize particle count based on device
      // macOS with Retina displays need fewer particles for smooth performance
      let numberOfParticles, closeOvals, midRangeOvals;
      
      if (isMobile) {
        numberOfParticles = 150;
        closeOvals = 50;
        midRangeOvals = 75;
      } else if (isMacOS && isRetina) {
        // Reduce particles on macOS Retina displays (more pixels to render)
        numberOfParticles = 250;
        closeOvals = 100;
        midRangeOvals = 125;
      } else {
        numberOfParticles = 400;
        closeOvals = 150;
        midRangeOvals = 200;
      }

      // Regular ovals (outer range)
      for (let i = 0; i < numberOfParticles; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        particles.push({
          angle: (Math.PI * 2 * i) / numberOfParticles,
          distance: 150,
          size: 0.3 + Math.random() * 0.8, // Reduced from 0.5-2.0 to 0.3-1.1
          speed: 0.25 + Math.random() * 0.25,
          offsetX: 0,
          offsetY: 0,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          lengthRatio: 1.5 + Math.random() * 2,
          freeX: startX,
          freeY: startY,
          freeVx: (Math.random() - 0.5) * 2,
          freeVy: (Math.random() - 0.5) * 2,
          currentX: startX,
          currentY: startY,
        });
      }

      // Add close ovals near cursor (2cm ≈ 75px)
      for (let i = 0; i < closeOvals; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        particles.push({
          angle: (Math.PI * 2 * i) / closeOvals,
          distance: 75, // Close to cursor (~2cm)
          size: 0.3 + Math.random() * 0.7, // Reduced from 0.5-1.7 to 0.3-1.0
          speed: 0.3 + Math.random() * 0.3,
          offsetX: 0,
          offsetY: 0,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          lengthRatio: 1.5 + Math.random() * 2,
          freeX: startX,
          freeY: startY,
          freeVx: (Math.random() - 0.5) * 2,
          freeVy: (Math.random() - 0.5) * 2,
          currentX: startX,
          currentY: startY,
        });
      }

      // Add mid-range ovals to fill empty areas during expansion
      for (let i = 0; i < midRangeOvals; i++) {
        const startX = Math.random() * canvas.width;
        const startY = Math.random() * canvas.height;
        particles.push({
          angle: (Math.PI * 2 * i) / midRangeOvals,
          distance: 180 + Math.random() * 40, // Mid-range (180-220px)
          size: 0.3 + Math.random() * 0.9, // Reduced from 0.5-1.8 to 0.3-1.2
          speed: 0.25 + Math.random() * 0.25,
          offsetX: 0,
          offsetY: 0,
          noiseOffsetX: Math.random() * 1000,
          noiseOffsetY: Math.random() * 1000,
          lengthRatio: 1.5 + Math.random() * 2,
          freeX: startX,
          freeY: startY,
          freeVx: (Math.random() - 0.5) * 2,
          freeVy: (Math.random() - 0.5) * 2,
          currentX: startX,
          currentY: startY,
        });
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;

      // Use willReadFrequently hint for better performance
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Check if mouse is idle (no movement for 2 seconds)
      if (Date.now() - mouse.lastMoveTime > 2000) {
        mouse.isIdle = true;
      }

      // Smoother mouse following
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      time += 0.012; // Increased animation speed from 0.008 to 0.012

      // Circular contraction and expansion - oscillates between min and max
      const minRadius = 150; // Increased from 80 to 150 for larger contracted circle
      const maxRadius = 280; // Expand farther from cursor
      const breathingWave = Math.sin(time * 0.8); // Increased from 0.6 to 0.8 for faster breathing
      const pulseRadius = minRadius + ((breathingWave + 1) / 2) * (maxRadius - minRadius);

      for (let i = 0; i < particles.length; i++) {
        let p = particles[i];

        let targetX, targetY;

        if (mouse.isIdle) {
          // Free movement mode
          p.freeX += p.freeVx;
          p.freeY += p.freeVy;

          // Bounce off edges
          if (p.freeX < 0 || p.freeX > canvas.width) p.freeVx *= -1;
          if (p.freeY < 0 || p.freeY > canvas.height) p.freeVy *= -1;

          targetX = p.freeX;
          targetY = p.freeY;
        } else {
          // Follow cursor mode
          p.angle += 0.006 * p.speed; // Increased rotation speed from 0.004 to 0.006

          // Irregular motion using sine waves
          p.offsetX = Math.sin(time * 0.5 + p.noiseOffsetX) * 30 + Math.cos(time * 0.3 + p.noiseOffsetX) * 20;
          p.offsetY = Math.cos(time * 0.4 + p.noiseOffsetY) * 30 + Math.sin(time * 0.6 + p.noiseOffsetY) * 20;

          // Calculate position in circle around mouse - use particle's distance property
          const baseDistance = p.distance; // Use individual particle distance (75px for close ones, 150px for others)
          const radius = (baseDistance < 100 ? baseDistance : pulseRadius) + Math.sin(time + i * 0.5) * 50;
          targetX = mouse.x + Math.cos(p.angle) * radius + p.offsetX;
          targetY = mouse.y + Math.sin(p.angle) * radius + p.offsetY;

          // Update free position to current position for smooth transition
          p.freeX = targetX;
          p.freeY = targetY;
        }

        // Smooth traveling animation with S-curve motion
        const lerpSpeed = 0.08;
        
        // Calculate movement direction
        const dx = targetX - p.currentX;
        const dy = targetY - p.currentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Calculate perpendicular direction for S-curve
        const perpX = -dy / (distance || 1);
        const perpY = dx / (distance || 1);
        
        // S-curve motion using combined sine waves for smooth S shape
        const sCurveAmplitude = 20;
        const sCurveFrequency = 2;
        const progress = 1 - Math.min(distance / 200, 1); // Progress along path
        const sCurveOffset = Math.sin(time * sCurveFrequency + i * 0.3) * sCurveAmplitude * Math.sin(progress * Math.PI);
        
        // Apply S-curve to the lerp movement
        p.currentX += (targetX - p.currentX) * lerpSpeed + perpX * sCurveOffset * lerpSpeed;
        p.currentY += (targetY - p.currentY) * lerpSpeed + perpY * sCurveOffset * lerpSpeed;

        // Calculate distance from cursor for fade effect
        const distanceFromCursor = Math.sqrt(
          Math.pow(p.currentX - mouse.x, 2) + Math.pow(p.currentY - mouse.y, 2)
        );
        
        // Fade out when close to cursor (within 100px)
        const fadeThreshold = 100;
        const distanceFade = Math.min(distanceFromCursor / fadeThreshold, 1);
        
        // Depth animation - coming to front and going to back
        const depthWave = Math.sin(time * 0.8 + i * 0.2); // -1 to 1
        const depthScale = 0.5 + (depthWave + 1) * 0.5; // 0.5 to 1.5 (scale factor)
        
        // Pulsing size and opacity for fade effect with depth
        const pulseSize = p.size + Math.sin(time * 1 + i) * 0.3;
        const baseOpacity = 0.4 + Math.sin(time * 1 + i) * 0.4;
        const depthOpacity = 0.3 + depthScale * 0.7; // Opacity based on depth (0.3 to 1.0)
        const opacity = baseOpacity * distanceFade * depthOpacity; // Apply all fade effects

        // Draw oval with glow effect
        // Only render particles that are visible (optimization)
        if (opacity > 0.01 && p.currentX >= -50 && p.currentX <= window.innerWidth + 50 && 
            p.currentY >= -50 && p.currentY <= window.innerHeight + 50) {
          ctx.save();
          
          // Glow effect - varies with size, distance, and depth
          ctx.shadowBlur = (8 + p.size * 3) * distanceFade * depthScale;
          ctx.shadowColor = `rgba(37, 99, 235, ${0.6 * distanceFade * depthOpacity})`;
          
          // Wavey motion - oscillate the oval's rotation angle
          const waveyAngle = p.angle + Math.sin(time * 2 + i * 0.3) * 0.5;
          
          // Draw varied oval (ellipse) with depth scaling
          const radiusX = pulseSize * 2 * depthScale; // Horizontal radius with depth
          const radiusY = pulseSize * depthScale; // Vertical radius with depth
          
          ctx.fillStyle = `rgba(37, 99, 235, ${opacity})`;
          ctx.beginPath();
          ctx.ellipse(p.currentX, p.currentY, radiusX, radiusY, waveyAngle, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    // Initialize
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none bg-transparent"
    />
  );
};

export default AntigravityDots;

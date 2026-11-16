"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

export const snappySpring = {
  type: "spring" as const,
  stiffness: 520,
  damping: 42,
  mass: 0.7,
};

export const spatialSpring = {
  type: "spring" as const,
  stiffness: 260,
  damping: 32,
  mass: 1.0,
};

export const criticallyDamped = {
  type: "spring" as const,
  stiffness: 400,
  damping: 38,
};

/**
 * KineticNumber: smoothly rolls and interpolates between numeric values using Framer Motion springs
 */
export function KineticNumber({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const springVal = useSpring(value, {
    stiffness: 280,
    damping: 30,
    mass: 0.8,
  });

  const [display, setDisplay] = useState(value.toFixed(decimals));

  useEffect(() => {
    springVal.set(value);
  }, [value, springVal]);

  useEffect(() => {
    const unsubscribe = springVal.on("change", (latest) => {
      setDisplay(Number(latest).toFixed(decimals));
    });
    return () => unsubscribe();
  }, [springVal, decimals]);

  return (
    <span className={`tabular-nums font-mono tracking-tight ${className}`}>
      {prefix}
      {Number(display).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}

/**
 * CryptographicScrambleText: cycles hex characters at 60fps before deterministically resolving to target text
 */
const HEX_GLYPHS = "0123456789ABCDEF";

export function CryptographicScrambleText({
  text,
  duration = 320,
  trigger,
  className = "",
}: {
  text: string;
  duration?: number;
  trigger?: any;
  className?: string;
}) {
  const [output, setOutput] = useState(text);

  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();

    const scramble = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        const resolvedLength = Math.floor(text.length * progress);
        let scrambled = text.slice(0, resolvedLength);

        for (let i = resolvedLength; i < text.length; i++) {
          if (text[i] === " " || text[i] === "-" || text[i] === ":" || text[i] === "/" || text[i] === "x") {
            scrambled += text[i];
          } else {
            scrambled += HEX_GLYPHS[Math.floor(Math.random() * HEX_GLYPHS.length)];
          }
        }
        setOutput(scrambled);
        frameId = requestAnimationFrame(scramble);
      } else {
        setOutput(text);
      }
    };

    frameId = requestAnimationFrame(scramble);
    return () => cancelAnimationFrame(frameId);
  }, [text, duration, trigger]);

  return <span className={`tabular-nums font-mono ${className}`}>{output}</span>;
}

/**
 * Magnetic proximity wrapper for primary action buttons (±4px translation within 24px proximity)
 */
export function MagneticElement({
  children,
  className = "",
  distanceThreshold = 36,
  pullStrength = 0.22,
}: {
  children: React.ReactNode;
  className?: string;
  distanceThreshold?: number;
  pullStrength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distX = e.clientX - centerX;
    const distY = e.clientY - centerY;
    const dist = Math.hypot(distX, distY);

    if (dist < distanceThreshold) {
      setOffset({
        x: Math.max(-5, Math.min(5, distX * pullStrength)),
        y: Math.max(-5, Math.min(5, distY * pullStrength)),
      });
    } else {
      setOffset({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 450, damping: 30 }}
      className={`inline-block ${className}`}
    >
      {children}
    </motion.div>
  );
}

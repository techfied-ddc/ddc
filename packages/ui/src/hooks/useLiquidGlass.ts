import { useEffect, useRef } from 'react';

interface UseLiquidGlassOptions {
  goldColor?: string;
  intensity?: number; // 0–1
}

/**
 * Draws a subtle animated sheen onto a <canvas> element,
 * creating the liquid-glass signature of the DDC design system.
 * Returns a ref to attach to the <canvas>.
 */
export const useLiquidGlass = (options: UseLiquidGlassOptions = {}) => {
  const { goldColor = 'rgba(212, 175, 55,', intensity = 0.06 } = options;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let t = 0;

    const resize = () => {
      const { offsetWidth: w, offsetHeight: h } = canvas;
      canvas.width  = w * devicePixelRatio;
      canvas.height = h * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      // Slow-moving radial sheen
      const cx = w * (0.5 + 0.3 * Math.sin(t * 0.7));
      const cy = h * (0.3 + 0.2 * Math.cos(t * 0.5));
      const r  = Math.max(w, h) * 0.7;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0,   `${goldColor} ${intensity})`);
      grad.addColorStop(0.5, `${goldColor} ${intensity * 0.4})`);
      grad.addColorStop(1,   `${goldColor} 0)`);

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      t += 0.005;
      rafRef.current = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [goldColor, intensity]);

  return canvasRef;
};

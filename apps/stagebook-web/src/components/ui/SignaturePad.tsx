import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

export function SignaturePad({ label, onSave, disabled = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#CBA848";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
  }, []);

  function getPos(event: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in event) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    }
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: React.MouseEvent | React.TouchEvent) {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setDrawing(true);
    setHasInk(true);
  }

  function move(event: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const { x, y } = getPos(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function end() {
    setDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk) return;
    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="signature-pad">
      <p className="signature-pad__label">{label}</p>
      <canvas
        ref={canvasRef}
        width={480}
        height={160}
        className="signature-pad__canvas"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="signature-pad__actions">
        <Button type="button" variant="ghost" onClick={clear}>
          Clear
        </Button>
        <Button type="button" variant="secondary" onClick={save} disabled={!hasInk || disabled}>
          Save signature
        </Button>
      </div>
    </div>
  );
}
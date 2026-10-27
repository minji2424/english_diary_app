import React, { useRef, useState, useEffect } from 'react';
import { X, Pencil, Eraser, RotateCcw, Trash2, Check } from 'lucide-react';
import { CAT_ASSETS, CatId } from './CatIcons';

interface CatDrawingCanvasProps {
  initialDrawing?: string;
  initialCatId?: CatId;
  onSaveDrawing: (dataUrl?: string) => void;
  onSelectCatPreset?: (catId: CatId) => void;
  onClose: () => void;
}

const PRESET_ROW_1: CatId[] = ['momo', 'neuru', 'hodu', 'dubu', 'tori'];
const PRESET_ROW_2: CatId[] = ['paw', 'sogeum', 'fish', 'mouse_cat', 'double_yarn'];

export const CatDrawingCanvas: React.FC<CatDrawingCanvasProps> = ({
  initialDrawing,
  initialCatId = 'momo',
  onSaveDrawing,
  onSelectCatPreset,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [hasDrawnSomething, setHasDrawnSomething] = useState(Boolean(initialDrawing));
  const [selectedPreset, setSelectedPreset] = useState<CatId | null>(initialCatId || null);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [isApplied, setIsApplied] = useState(false);

  const CANVAS_WIDTH = 340;
  const CANVAS_HEIGHT = 220;

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialDrawing) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        saveHistoryState();
        setHasDrawnSomething(true);
      };
      img.src = initialDrawing;
    } else {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      saveHistoryState();
    }
  }, []);

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    setHistory((prev) => [...prev.slice(-20), data]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop();
    const previous = newHistory[newHistory.length - 1];
    ctx.putImageData(previous, 0, 0);
    setHistory(newHistory);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    saveHistoryState();
    setHasDrawnSomething(false);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {}
    setIsDrawing(true);
    setHasDrawnSomething(true);

    const { x, y } = getCanvasCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = 16;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#583973';
      ctx.lineWidth = 3.5;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && e.pointerId) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {}
    }
    saveHistoryState();
  };

  // Stamp / select preset cat
  const handleSelectPreset = (catId: CatId) => {
    setSelectedPreset(catId);
    onSelectCatPreset?.(catId);

    // Also draw the preset onto canvas so user can see it or add doodles
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const asset = CAT_ASSETS[catId];
    if (!asset) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      const size = 150;
      const x = (CANVAS_WIDTH - size) / 2;
      const y = (CANVAS_HEIGHT - size) / 2;
      ctx.drawImage(img, x, y, size, size);
      saveHistoryState();
      setHasDrawnSomething(true);
    };
    img.src = asset.src;
  };

  // Save / apply and close
  const handleApply = () => {
    const canvas = canvasRef.current;
    setIsApplied(true);

    if (hasDrawnSomething && canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSaveDrawing(dataUrl);
    } else if (selectedPreset) {
      onSelectCatPreset?.(selectedPreset);
      onSaveDrawing(undefined);
    }

    setTimeout(() => {
      onClose();
    }, 350);
  };

  return (
    <div className="relative w-full max-w-sm sm:max-w-md bg-[#FAF9FB] rounded-[36px] shadow-2xl border border-purple-100 p-6 flex flex-col items-center select-none animate-fadeIn max-h-[90vh] overflow-y-auto">
      {/* Top-Left Circular Close Button matching 바텀시트.png */}
      <div className="w-full flex items-start justify-between mb-1">
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="w-8 h-8 rounded-full bg-[#E3D9E9] hover:bg-[#D5C7DE] text-[#7D4C7D] flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Centered Title matching 바텀시트.png (Font: Griun Mongtori) */}
      <div className="text-center mb-5">
        <h2 className="text-3xl sm:text-4xl font-mongtori font-bold text-[#7D4C7D] leading-tight tracking-tight">
          Draw Your
          <br />
          Own Cat
        </h2>
      </div>

      {/* Drawing Canvas Box matching 바텀시트.png (#ECEBEB background) */}
      <div className="relative w-full h-52 sm:h-56 rounded-[28px] bg-[#ECEBEB] overflow-hidden flex items-center justify-center shadow-inner">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-crosshair touch-none"
        />

        {!hasDrawnSomething && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
            <span className="text-xs font-sans-clean text-[#7D4C7D]">
              고양이를 자유롭게 그려보세요 🐾
            </span>
          </div>
        )}
      </div>

      {/* Toolbar row matching 바텀시트.png */}
      <div className="w-full flex items-center justify-between px-2 pt-4 pb-5">
        {/* Left Tools: Pen, Eraser, Solid Purple Circle */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setTool('pen')}
            className={`p-1.5 rounded-full transition-transform cursor-pointer ${
              tool === 'pen' ? 'text-[#7D4C7D] scale-110' : 'text-[#A892B1] hover:text-[#7D4C7D]'
            }`}
            title="연필 / 펜"
          >
            <Pencil className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={() => setTool('eraser')}
            className={`p-1.5 rounded-full transition-transform cursor-pointer ${
              tool === 'eraser' ? 'text-[#7D4C7D] scale-110' : 'text-[#A892B1] hover:text-[#7D4C7D]'
            }`}
            title="지우개"
          >
            <Eraser className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Solid Purple Circle */}
          <div
            className="w-5 h-5 rounded-full bg-[#583973] shadow-xs"
            title="펜 색상"
          />
        </div>

        {/* Right Tools: Undo, Clear, Checkmark matching 바텀시트.png */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleUndo}
            className="p-1.5 text-[#7D4C7D] hover:opacity-75 transition-opacity cursor-pointer"
            title="되돌리기"
          >
            <RotateCcw className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-[#7D4C7D] hover:opacity-75 transition-opacity cursor-pointer"
            title="전체 지우기"
          >
            <Trash2 className="w-5 h-5 stroke-[2]" />
          </button>

          <button
            type="button"
            onClick={handleApply}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isApplied
                ? 'bg-emerald-600 text-white'
                : 'text-[#7D4C7D] hover:bg-purple-100/60'
            }`}
            title="적용하기"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* Subtitle Separator matching 바텀시트.png */}
      <div className="text-center mb-4">
        <span className="text-xs font-sans-clean font-semibold text-[#BBAAC7] tracking-wider uppercase">
          OR Choose Your Cat
        </span>
      </div>

      {/* Preset Cat Grid (2 rows of 5 drawings matching 바텀시트.png) */}
      <div className="w-full space-y-3 px-1 pb-1">
        {/* Row 1 */}
        <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
          {PRESET_ROW_1.map((catKey) => {
            const isSelected = selectedPreset === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleSelectPreset(catKey)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all p-1 group cursor-pointer hover:scale-115 ${
                  isSelected ? 'bg-purple-100/70 ring-2 ring-[#7D4C7D] scale-110' : 'hover:bg-purple-50/50'
                }`}
                title={CAT_ASSETS[catKey].name}
              >
                <img
                  src={CAT_ASSETS[catKey].src}
                  alt={CAT_ASSETS[catKey].name}
                  className="w-10 h-10 object-contain pointer-events-none select-none drop-shadow-xs"
                />
              </button>
            );
          })}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-5 gap-2 items-center justify-items-center">
          {PRESET_ROW_2.map((catKey) => {
            const isSelected = selectedPreset === catKey;
            return (
              <button
                key={catKey}
                type="button"
                onClick={() => handleSelectPreset(catKey)}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all p-1 group cursor-pointer hover:scale-115 ${
                  isSelected ? 'bg-purple-100/70 ring-2 ring-[#7D4C7D] scale-110' : 'hover:bg-purple-50/50'
                }`}
                title={CAT_ASSETS[catKey].name}
              >
                <img
                  src={CAT_ASSETS[catKey].src}
                  alt={CAT_ASSETS[catKey].name}
                  className="w-10 h-10 object-contain pointer-events-none select-none drop-shadow-xs"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

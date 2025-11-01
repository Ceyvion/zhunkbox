import { type StickerStyle } from '../types'

interface FloatingToolbarProps {
  slotIndex: number
  style: StickerStyle
  onStyleChange: (index: number, partial: Partial<StickerStyle>) => void
  onDuplicate?: () => void
  onDelete: () => void
  onBringToFront?: () => void
  onSendToBack?: () => void
}

export function FloatingToolbar({
  slotIndex,
  style,
  onStyleChange,
  onDuplicate,
  onDelete,
  onBringToFront,
  onSendToBack,
}: FloatingToolbarProps) {
  return (
    <div className="floating-toolbar">
      <div className="floating-toolbar-section">
        <label className="floating-toolbar-label">
          <span className="text-xs">Size</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={style.scale}
            onChange={(e) =>
              onStyleChange(slotIndex, { scale: Number.parseFloat(e.target.value) })
            }
            className="slider"
          />
          <span className="text-xs opacity-70">{(style.scale * 100).toFixed(0)}%</span>
        </label>
      </div>

      <div className="floating-toolbar-section">
        <label className="floating-toolbar-label">
          <span className="text-xs">Rotate</span>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={style.rotate}
            onChange={(e) =>
              onStyleChange(slotIndex, { rotate: Number.parseInt(e.target.value) })
            }
            className="slider"
          />
          <span className="text-xs opacity-70">{style.rotate}°</span>
        </label>
      </div>

      <div className="floating-toolbar-divider" />

      <div className="floating-toolbar-actions">
        {onBringToFront && (
          <button
            className="toolbar-btn"
            onClick={onBringToFront}
            title="Bring to Front"
          >
            ⬆︎
          </button>
        )}
        {onSendToBack && (
          <button
            className="toolbar-btn"
            onClick={onSendToBack}
            title="Send to Back"
          >
            ⬇︎
          </button>
        )}
        {onDuplicate && (
          <button
            className="toolbar-btn"
            onClick={onDuplicate}
            title="Duplicate"
          >
            ⧉
          </button>
        )}
        <button
          className="toolbar-btn toolbar-btn--danger"
          onClick={onDelete}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

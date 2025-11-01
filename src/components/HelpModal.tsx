import { Modal } from './Modal'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

export function HelpModal({ open, onClose }: HelpModalProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const mod = isMac ? '⌘' : 'Ctrl'

  return (
    <Modal
      open={open}
      title="Keyboard Shortcuts & Help"
      onClose={onClose}
      footer={
        <button className="tape-btn" onClick={onClose}>
          Got it!
        </button>
      }
    >
      <div className="space-y-4 text-sm">
        <section>
          <h3 className="font-semibold mb-2 text-base">Getting Started</h3>
          <ol className="list-decimal list-inside space-y-1 opacity-90">
            <li>Select a sticker from the tray on the right</li>
            <li>Tap/click an empty slot to place it</li>
            <li>Drag stickers to move them around</li>
            <li>Tap a placed sticker to adjust size & rotation</li>
            <li>Place at least 3 stickers to unlock checkout</li>
          </ol>
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-base">Keyboard Shortcuts</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="opacity-90">Undo</span>
              <kbd className="kbd">{mod} + Z</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-90">Redo</span>
              <kbd className="kbd">{mod} + {isMac ? '⇧ + Z' : 'Y'}</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-90">Preview Mode</span>
              <kbd className="kbd">{mod} + P</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="opacity-90">Exit Preview</span>
              <kbd className="kbd">ESC</kbd>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2 text-base">Tips & Tricks</h3>
          <ul className="space-y-1 opacity-90">
            <li>• Use the floating toolbar to fine-tune sticker placement</li>
            <li>• Layer controls let you overlap stickers creatively</li>
            <li>• Duplicate button quickly creates copies of stickers</li>
            <li>• Export your design to share it with friends</li>
            <li>• Try different themes for varied aesthetics</li>
          </ul>
        </section>

        <section className="pt-2 border-t border-current opacity-50">
          <p className="text-xs">
            The Zhunk Box v1.0.0 — DIY phone case builder
          </p>
        </section>
      </div>
    </Modal>
  )
}

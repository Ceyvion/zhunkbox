type Props = {
  placedCount: number
  minReq: number
  total: number
  budget?: number
  onCheckout: () => void
}

export function CheckoutBar({ placedCount, minReq, total, budget, onCheckout }: Props) {
  const unlocked = placedCount >= minReq
  return (
    <section className="paper p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm">Progress</div>
          <div className="font-semibold">{placedCount} / {minReq} placed</div>
        </div>
        <div className="text-right">
          <div className="text-sm">Total</div>
          <div className="font-semibold">${total.toFixed(2)}{budget ? ` / $${budget.toFixed(0)}` : ''}</div>
        </div>
      </div>
      <button
        className={`mt-3 w-full tape-btn ${unlocked ? '' : 'opacity-50 cursor-not-allowed grayscale'}`}
        disabled={!unlocked}
        onClick={onCheckout}
      >
        {unlocked ? 'Tape to Checkout' : 'Add 3 pieces to continue'}
      </button>
    </section>
  )
}

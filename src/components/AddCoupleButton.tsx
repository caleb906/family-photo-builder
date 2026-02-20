'use client'

export function AddCoupleButton() {
  const handleClick = () => {
    const brideCheck = document.getElementById('person-bride') as HTMLInputElement
    const groomCheck = document.getElementById('person-groom') as HTMLInputElement
    if (brideCheck) brideCheck.checked = true
    if (groomCheck) groomCheck.checked = true
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="btn btn-sm bg-pink-100 text-pink-800 hover:bg-pink-200"
    >
      + Add Couple
    </button>
  )
}

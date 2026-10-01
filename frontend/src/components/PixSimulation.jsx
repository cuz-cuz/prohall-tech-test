import { useMemo, useState } from 'react'

import { formatCurrencyFromCents } from '../utils/formatters'

const GRID = 25
const FINDER = 7

// Deliberately not the Central Bank's EMV format, so no banking app tries to
// read it as a real charge.
function simulatedPixCode(reference, totalCents) {
  const compactReference = reference.replace(/-/g, '').toUpperCase()
  return `MOSAICO-PIX-SIMULADO-${compactReference}-${String(totalCents).padStart(8, '0')}`
}

function seededBits(text) {
  let state = 2166136261
  for (const character of text) state = Math.imul(state ^ character.charCodeAt(0), 16777619)
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) % 2 === 0
  }
}

function inFinder(x, y) {
  const corners = [[0, 0], [GRID - FINDER, 0], [0, GRID - FINDER]]
  return corners.some(([cx, cy]) => x >= cx - 1 && x <= cx + FINDER && y >= cy - 1 && y <= cy + FINDER)
}

/** Decorative QR-like pattern; it does not encode anything and cannot be scanned. */
function IllustrativeQr({ code }) {
  const cells = useMemo(() => {
    const next = seededBits(code)
    const filled = []
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID; x += 1) {
        if (!inFinder(x, y) && next()) filled.push([x, y])
      }
    }
    return filled
  }, [code])

  const finders = [[0, 0], [GRID - FINDER, 0], [0, GRID - FINDER]]

  return (
    <svg className="pix-simulation__qr" viewBox={`-2 -2 ${GRID + 4} ${GRID + 4}`} role="img" aria-label="QR code ilustrativo do Pix simulado">
      <rect x="-2" y="-2" width={GRID + 4} height={GRID + 4} fill="#fff" />
      {finders.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={FINDER} height={FINDER} fill="currentColor" />
          <rect x={x + 1} y={y + 1} width={FINDER - 2} height={FINDER - 2} fill="#fff" />
          <rect x={x + 2} y={y + 2} width={FINDER - 4} height={FINDER - 4} fill="currentColor" />
        </g>
      ))}
      {cells.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" />)}
    </svg>
  )
}

export function PixSimulation({ reference, totalCents }) {
  const code = simulatedPixCode(reference, totalCents)
  const [copyStatus, setCopyStatus] = useState('')

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyStatus('Código copiado.')
    } catch {
      setCopyStatus('Não foi possível copiar. Selecione o código manualmente.')
    }
  }

  return (
    <div className="pix-simulation">
      <IllustrativeQr code={code} />
      <div className="pix-simulation__content">
        <p className="pix-simulation__amount">
          Valor no Pix <strong>{formatCurrencyFromCents(totalCents)}</strong>
        </p>
        <label className="form-field" htmlFor="pix-copy-paste">
          <span>Pix copia e cola (fictício)</span>
          <input id="pix-copy-paste" type="text" value={code} readOnly onFocus={(event) => event.target.select()} />
        </label>
        <button className="pix-simulation__copy" type="button" onClick={copyCode}>Copiar código</button>
        <p className="pix-simulation__status" role="status">{copyStatus}</p>
      </div>
    </div>
  )
}

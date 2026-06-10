import { useEffect, useRef, useCallback } from 'react'

const DREMPEL = 18       // minimale versnelling om als schudden te tellen
const COOLDOWN = 3000    // ms tussen twee shakes

export function useShake(onShake) {
  const laatsteTrigger = useRef(0)
  const vorigeVersnelling = useRef(null)

  const handleMotion = useCallback((e) => {
    const acc = e.accelerationIncludingGravity
    if (!acc) return

    const { x, y, z } = acc
    if (x == null || y == null || z == null) return

    if (vorigeVersnelling.current) {
      const dx = Math.abs(x - vorigeVersnelling.current.x)
      const dy = Math.abs(y - vorigeVersnelling.current.y)
      const dz = Math.abs(z - vorigeVersnelling.current.z)

      if (dx + dy + dz > DREMPEL) {
        const nu = Date.now()
        if (nu - laatsteTrigger.current > COOLDOWN) {
          laatsteTrigger.current = nu
          onShake()
        }
      }
    }

    vorigeVersnelling.current = { x, y, z }
  }, [onShake])

  useEffect(() => {
    // iOS 13+ vereist expliciete toestemming
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      // Sla op dat we nog toestemming moeten vragen — wordt gevraagd via ShakeEasterEgg
      return
    }

    window.addEventListener('devicemotion', handleMotion)
    return () => window.removeEventListener('devicemotion', handleMotion)
  }, [handleMotion])

  // Geef een functie terug om iOS-toestemming te vragen (moet via user gesture)
  const vraagIOSToestemming = useCallback(async () => {
    if (typeof DeviceMotionEvent?.requestPermission === 'function') {
      try {
        const result = await DeviceMotionEvent.requestPermission()
        if (result === 'granted') {
          window.addEventListener('devicemotion', handleMotion)
        }
      } catch (e) {
        console.warn('DeviceMotion toestemming geweigerd', e)
      }
    }
  }, [handleMotion])

  return { vraagIOSToestemming }
}

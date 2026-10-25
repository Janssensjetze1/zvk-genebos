// Foto's van een gsm zijn al snel 3 tot 10 MB. Voor een profielfoto is dat
// zinloos groot en een trage upload mislukt makkelijk. Daarom verkleinen we ze
// eerst op het toestel tot een JPEG van hoogstens `max` pixels breed of hoog.
// Lukt dat niet (bv. een formaat dat de browser niet kan tekenen), dan geven
// we het originele bestand terug.

export async function verkleinFoto(bestand, max = 800, kwaliteit = 0.85) {
  try {
    const bitmap = await createImageBitmap(bestand)
    const schaal = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * schaal)
    canvas.height = Math.round(bitmap.height * schaal)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise(klaar => canvas.toBlob(klaar, 'image/jpeg', kwaliteit))
    return blob ? new File([blob], 'foto.jpg', { type: 'image/jpeg' }) : bestand
  } catch {
    return bestand
  }
}

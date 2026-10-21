import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Staat de ZVK-fanshop open? Zo niet, dan verdwijnt het tabblad uit het menu.
// Het beheer stuurt 'zvk:shop-gewijzigd' na openen of sluiten, zodat het menu
// meteen mee verandert. null = nog aan het laden.
export const SHOP_GEWIJZIGD = 'zvk:shop-gewijzigd'

export function useShopOpen() {
  const [open, setOpen] = useState(null)

  useEffect(() => {
    let actief = true
    async function haal() {
      const { data } = await supabase.from('shop_instellingen').select('open').maybeSingle()
      if (actief) setOpen(data?.open ?? false)
    }
    haal()
    window.addEventListener(SHOP_GEWIJZIGD, haal)
    return () => {
      actief = false
      window.removeEventListener(SHOP_GEWIJZIGD, haal)
    }
  }, [])

  return open
}

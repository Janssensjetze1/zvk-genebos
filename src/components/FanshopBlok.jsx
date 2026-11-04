import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useShopOpen } from '../hooks/useShopOpen'
import { euro } from '../lib/fanshop'
import { Icoon } from '../ui'

// Blok op het startscherm (app en desktop) dat naar de fanshop wijst. Enkel
// te zien als de winkel open is en er iets te koop is. Toont een paar
// producten met foto en prijs. Stijlen: .z-shopblok-* in ui/ui.css.

const MAX = 3

export default function FanshopBlok({ pad }) {
  const open = useShopOpen()
  const [producten, setProducten] = useState(null)

  useEffect(() => {
    if (!open) return
    let actief = true
    supabase.from('shop_producten')
      .select('id, naam, prijs, foto_url')
      .eq('actief', true)
      .order('volgorde').order('created_at')
      .then(({ data }) => { if (actief) setProducten(data ?? []) })
    return () => { actief = false }
  }, [open])

  if (!open || !producten?.length) return null
  const getoond = producten.slice(0, MAX)
  const meer = producten.length - getoond.length

  return (
    <Link to={pad} className="z-shopblok">
      <img src="/logo.png" alt="" aria-hidden="true" className="z-shopblok-logo" />
      <div className="z-shopblok-kop">
        <div>
          <span className="z-shop-status"><i />Nu open voor bestellingen</span>
          <h3>ZVK-<span>fanshop</span></h3>
        </div>
        <span className="z-shopblok-pijl" aria-hidden="true"><Icoon naam="chevron" grootte={18} dikte={2.4} /></span>
      </div>

      <div className={`z-shopblok-rij${getoond.length === 1 ? ' een' : ''}`} style={{ '--kolommen': getoond.length }}>
        {getoond.map(p => (
          <div key={p.id} className="z-shopblok-product">
            <span className="z-shopblok-beeld">
              {p.foto_url
                ? <img src={p.foto_url} alt="" loading="lazy" />
                : <img src="/logo.png" alt="" className="z-shopblok-plaats" />}
            </span>
            <span className="z-shopblok-naam">{p.naam}</span>
            <span className="z-shopblok-prijs">{euro(p.prijs)}</span>
          </div>
        ))}
      </div>

      <span className="z-shopblok-cta">
        {meer > 0 ? `Bekijk alle ${producten.length} producten` : 'Naar de fanshop'}
      </span>
    </Link>
  )
}

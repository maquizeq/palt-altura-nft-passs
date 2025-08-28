import { useEffect, useMemo, useState } from 'react'
import { BrowserProvider, Contract, formatEther } from 'ethers'
import abiWrap from './abi/AlturaNFTPasss.abi.json'

const VITE_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined
const IPFS_GATEWAY = (import.meta.env as any).VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
const GATEWAYS: string[] = Array.from(new Set([
  IPFS_GATEWAY,
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://ipfs.io/ipfs/',
]))

const ABI: any = (abiWrap as any).abi || abiWrap

export default function App() {
  const [address, setAddress] = useState<string>()
  const [chainOk, setChainOk] = useState<boolean>(true)
  const [priceWei, setPriceWei] = useState<bigint>()
  const [duration, setDuration] = useState<number>()
  const [tokenIdInput, setTokenIdInput] = useState<string>('1')
  const [tokenURI, setTokenURI] = useState<string>()
  const [activo, setActivo] = useState<boolean>()
  const [status, setStatus] = useState<string>('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [jsonUrl, setJsonUrl] = useState<string | undefined>()
  const [expiracion, setExpiracion] = useState<number | undefined>()
  // Modo de la app: cliente o empresa (verificador)
  const [mode, setMode] = useState<'cliente' | 'empresa'>('cliente')
  // Verificador (empresa)
  const [verifyAddr, setVerifyAddr] = useState<string>('')
  const [isMember, setIsMember] = useState<boolean | undefined>(undefined)
  const [discountPct, setDiscountPct] = useState<number>(10)

  const contractAddress = VITE_CONTRACT_ADDRESS

  const provider = useMemo(() => {
    if ((window as any).ethereum) {
      return new BrowserProvider((window as any).ethereum)
    }
    return undefined
  }, [])

  async function getContract(): Promise<Contract> {
    if (!provider) throw new Error('Metamask no detectado')
    if (!contractAddress) throw new Error('VITE_CONTRACT_ADDRESS no definido')
    const signer = await provider.getSigner()
    return new Contract(contractAddress, ABI, signer)
  }

  async function connect() {
    try {
      await (window as any).ethereum?.request?.({ method: 'eth_requestAccounts' })
      const signer = await provider!.getSigner()
      const addr = await signer.getAddress()
      setAddress(addr)
      const net = await provider!.getNetwork()
      setChainOk(net.chainId === 11155111n) // Sepolia
      await loadTier0()
    } catch (e: any) {
      setStatus(e.message || String(e))
    }
  }

  async function loadTier0() {
    try {
      const c = await getContract()
      const n = await (c as any).niveles(0)
      setPriceWei(n.precioWei as bigint)
      setDuration(Number(n.duracion))
    } catch (e: any) {
      setStatus(e.message || String(e))
    }
  }

  async function buy() {
    try {
      if (priceWei === undefined) await loadTier0()
      const c = await getContract()
      const tx = await (c as any).comprar(0, { value: priceWei })
      const rc = await tx.wait()
      setStatus('Compra OK: ' + rc?.hash)
    } catch (e: any) {
      setStatus('Error: ' + (e.message || String(e)))
    }
  }

  async function renew() {
    try {
      const id = BigInt(tokenIdInput || '1')
      const c = await getContract()
      const tx = await (c as any).renovar(id, { value: priceWei })
      const rc = await tx.wait()
      setStatus('Renovación OK: ' + rc?.hash)
    } catch (e: any) {
      setStatus('Error: ' + (e.message || String(e)))
    }
  }

  async function readToken() {
    try {
      const id = BigInt(tokenIdInput || '1')
      const c = await getContract()
      const uri = await (c as any).tokenURI(id)
      const act = await (c as any).tokenActivo(id)
  const exp = await (c as any).expiracionDe(id)
      setTokenURI(uri)
      setActivo(Boolean(act))
  setExpiracion(Number(exp))
      // Try to fetch metadata from multiple gateways
      let found = false
      let lastErr: any
      for (const gw of GATEWAYS) {
        try {
          const httpJson = ipfsToHttp(uri, gw)
          const res = await fetch(httpJson, { cache: 'no-store' })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const meta = await res.json()
          setJsonUrl(httpJson)
          if (meta?.image) setImageUrl(ipfsToHttp(String(meta.image), gw))
          found = true
          break
        } catch (e) {
          lastErr = e
          continue
        }
      }
      if (!found) setStatus('Error: no se pudo obtener metadata (gateway caído o CID sin pin)')
    } catch (e: any) {
      setStatus('Error: ' + (e.message || String(e)))
    }
  }

  // Empresa: verifica si una dirección es miembro activo (usa esMiembro)
  async function verifyMembership() {
    try {
      setStatus('')
      setIsMember(undefined)
      const addr = verifyAddr?.trim()
      if (!addr) throw new Error('Ingresa una dirección a verificar')
      const c = await getContract()
      const ok = await (c as any).esMiembro(addr)
      setIsMember(Boolean(ok))
    } catch (e: any) {
      setStatus('Error: ' + (e.message || String(e)))
    }
  }

  function ipfsToHttp(u?: string, gw?: string) {
    if (!u) return u as any
    const base = (gw || IPFS_GATEWAY).endsWith('/') ? (gw || IPFS_GATEWAY) : (gw || IPFS_GATEWAY) + '/'
    return u.startsWith('ipfs://') ? base + u.slice(7) : u
  }

  function formatDuration(total?: number) {
    if (!total && total !== 0) return '—'
    let s = Math.max(0, Math.floor(total))
    const d = Math.floor(s / 86400); s -= d * 86400
    const h = Math.floor(s / 3600); s -= h * 3600
    const m = Math.floor(s / 60); s -= m * 60
    const parts = [] as string[]
    if (d) parts.push(`${d}d`)
    if (h || parts.length) parts.push(`${h}h`)
    if (m || parts.length) parts.push(`${m}m`)
    parts.push(`${s}s`)
    return parts.join(' ')
  }
  function formatRemaining(exp?: number) {
    if (!exp) return '—'
    const now = Math.floor(Date.now() / 1000)
    return formatDuration(exp - now)
  }

  function formatDays(total?: number) {
    if (!total && total !== 0) return '—'
    const d = Math.round(total / 86400)
    return `${d} d`
  }

  useEffect(() => {
    if ((window as any).ethereum?.on) {
      const onChainChanged = () => window.location.reload()
      ;(window as any).ethereum.on('chainChanged', onChainChanged)
      return () => (window as any).ethereum?.removeListener?.('chainChanged', onChainChanged)
    }
  }, [])

  useEffect(() => {
    // Auto-connect if already authorized
    (async () => {
      try {
        const accounts = await (window as any).ethereum?.request?.({ method: 'eth_accounts' })
        if (accounts && accounts.length > 0) {
          await connect()
        }
      } catch {}
    })()
  }, [])

  return (
    <div style={{ maxWidth: 820, margin: '20px auto', padding: 16, fontFamily: 'system-ui' }}>
      <h1>Altura NFT Passs</h1>
      <p>Contrato: <b>{contractAddress ?? '(VITE_CONTRACT_ADDRESS no definido)'}</b></p>
      {provider ? (
        <button onClick={connect}>Conectar MetaMask</button>
      ) : (
        <p>Instala MetaMask para continuar.</p>
      )}
      <p>Cuenta: {address ?? '—'} {chainOk ? '' : '(red no es Sepolia)'}</p>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button onClick={() => setMode('cliente')} style={{ background: mode==='cliente'? '#eaeaea':'#f7f7f7' }}>Modo Cliente</button>
        <button onClick={() => setMode('empresa')} style={{ background: mode==='empresa'? '#eaeaea':'#f7f7f7' }}>Modo Empresa (Verificador)</button>
      </div>

      {mode === 'cliente' && (
        <div>
          <hr />
          <h3>Nivel 0</h3>
          <p>Precio: {priceWei ? `${formatEther(priceWei)} ETH` : '—'} | Duración: {formatDays(duration)}</p>
          <button onClick={buy} disabled={!priceWei}>Comprar ({formatDays(duration)})</button>

          <hr />
          <h3>Consultar token</h3>
          <input value={tokenIdInput} onChange={e => setTokenIdInput(e.target.value)} />
          <button onClick={readToken}>Leer tokenURI/estado</button>
          <div>tokenURI: {tokenURI ?? '—'}</div>
          <div>activo: {activo === undefined ? '—' : String(activo)}</div>
          <div>expira: {expiracion ? new Date(expiracion * 1000).toLocaleString() : '—'}</div>
          <div>faltan: {formatRemaining(expiracion)}</div>
          {jsonUrl ? (
            <div>
              <div><a href={jsonUrl} target="_blank" rel="noreferrer">Ver metadata</a></div>
              {imageUrl && (<img src={imageUrl} alt="NFT" style={{maxWidth: '280px', marginTop: 8, borderRadius: 8}} />)}
            </div>
          ) : null}

          <h3>Renovar</h3>
          <button onClick={renew} disabled={!priceWei}>Renovar ({formatDays(duration)}) token #{tokenIdInput}</button>
        </div>
      )}

      {mode === 'empresa' && (
        <div>
          <hr />
          <h3>Verificador para Empresas</h3>
          <p>Ingresa la dirección del cliente para verificar si su membresía está activa.</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ minWidth: 360 }} placeholder="0x..." value={verifyAddr} onChange={e => setVerifyAddr(e.target.value)} />
            <button onClick={verifyMembership}>Verificar</button>
            <span>Descuento configurado: </span>
            <input type="number" min={0} max={100} value={discountPct} onChange={e => setDiscountPct(Number(e.target.value))} style={{ width: 80 }} />%
          </div>
          <div style={{ marginTop: 8 }}>
            {isMember === undefined ? '—' : (isMember ? `Válido: aplica ${discountPct}% de descuento` : 'No válido: no aplica descuento')}
          </div>
          <p style={{ color: '#666', marginTop: 8, fontSize: 13 }}>Tip: Puedes pedir al cliente que firme en tu app para probar que controla esa dirección (Sign-In with Ethereum) y evitar suplantaciones.</p>
        </div>
      )}

      <hr />
      <div style={{ color: status?.startsWith('Error') ? 'crimson' : '#444' }}>{status}</div>
    </div>
  )
}

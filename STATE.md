# Snapshot: MVP Altura NFT Passs (Sepolia)

Este snapshot captura el estado actual del proyecto para poder volver fácilmente a este punto.

## Contrato en Sepolia
- Dirección: `0x9e9e19762727641723FcE12583eE798118B9fC9d`
- Verificado: https://sepolia.etherscan.io/address/0x9e9e19762727641723FcE12583eE798118B9fC9d
- Nombre: Altura NFT Passs (ERC-721)
- Suministro máx.: 100

## Metadata / IPFS
- BaseURI on-chain: `ipfs://bafybeibgvi6rxkrnszhxsgr3rf3fq5qt55rw3f5prltmqxunb4w4pgkl7e/`
- Imagen (única para todos): `ipfs://bafybeicp4nflpeczb25edvkpqa4r6wf3hpyd3ekbraxlglc5dfhxih6gpe`
- Archivos generados: `metadata/1.json` … `metadata/100.json`

## Frontend (web)
- Env local: `web/.env.local`
  - `VITE_CONTRACT_ADDRESS=0x9e9e19762727641723FcE12583eE798118B9fC9d`
  - `VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/`
- Funcionalidades: conectar wallet, comprar, renovar, ver expiración y mostrar imagen desde IPFS con fallback de gateways.

## Cómo retomar rápido
1) Node 18+ y npm instalados.
2) Instalar dependencias en el root y en `web/`.
3) Compilar y correr frontend.

> Referencia de scripts (no son obligatorios, sólo a modo de guía):
- Root: `npm run build`, `npm run test`, `npm run deploy:sepolia`
- Web: `npm ci` y `npm run dev`

## Notas
- Variables importantes (.env):
  - `SEPOLIA_RPC_URL`, `PRIVATE_KEY`, `ETHERSCAN_API_KEY`
  - `MEMBERSHIP_NAME`, `MEMBERSHIP_DESC`, `MEMBERSHIP_COUNT`
  - `MEMBERSHIP_IMAGE_URI`, `MEMBERSHIP_BASEURI`
- Script de metadata: `scripts/generate-metadata.ts` (usa dotenv).
- BaseURI se establece con `scripts/set-baseuri.ts`.

---
Marca: v0.1.0-mvp

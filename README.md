# Altura NFT Passs (Hardhat + TypeScript)

Proyecto Hardhat con TypeScript para el sistema de membresías Altura NFT Passs. Incluye contrato ERC721 de membresías con niveles, pruebas automatizadas y scripts de despliegue (local y Sepolia).

## Requisitos
- Node.js 18+
- npm

## Comandos clave (Windows CMD)

```cmd
:: instalar dependencias
npm install

:: compilar contratos
npm run build

:: ejecutar tests
npm test

:: desplegar a la red interna de Hardhat
npm run deploy:local
```

## Estructura
- `contracts/AlturaNFTPasss.sol` – contrato principal de membresías
- `test/MembershipNFT.test.ts` – pruebas del contrato de membresías (ES)
- `scripts/deploy-altura.ts` – script de despliegue
- `hardhat.config.ts` – configuración de compilador, redes y rutas

## Siguientes pasos
- Crea nuevos contratos en `contracts/`
- Escribe pruebas en `test/`
- Ajusta el compilador en `hardhat.config.ts` si lo necesitas

## Frontend (web)

- App React + Vite en `web/`.
- Variables de entorno (prefijo VITE_):
	- `VITE_CONTRACT_ADDRESS` (Sepolia)
	- `VITE_IPFS_GATEWAY` (p.ej. https://ipfs.io/ipfs/)

### Deploy en Vercel

1. Sube este repo a GitHub.
2. En Vercel: "Import Project" y selecciona el repo.
3. Raíz: `web/` (configurada en `vercel.json`).
4. Build Command: `npm run build` | Output: `dist`
5. Variables (Project Settings → Environment Variables):
	 - `VITE_CONTRACT_ADDRESS=0x9e9e19762727641723FcE12583eE798118B9fC9d`
	 - `VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/`
6. Deploy → obtendrás una URL pública HTTPS.

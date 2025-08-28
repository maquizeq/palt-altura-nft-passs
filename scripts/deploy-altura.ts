import { ethers } from "hardhat";

async function main() {
  const nombre = process.env.MEMBERSHIP_NAME || "Altura NFT Passs";
  const simbolo = process.env.MEMBERSHIP_SYMBOL || "ALTURA";
  const baseURI = process.env.MEMBERSHIP_BASEURI || "https://example.com/meta/";
  const maxSupply = Number(process.env.MEMBERSHIP_MAX_SUPPLY || 100);

  const Factory = await ethers.getContractFactory("AlturaNFTPasss");
  const contrato = await Factory.deploy(nombre, simbolo, baseURI, maxSupply);
  await contrato.waitForDeployment();
  const addr = await contrato.getAddress();
  console.log("AlturaNFTPasss desplegado en:", addr);

  const price = process.env.MEMBERSHIP_PRICE_WEI ? BigInt(process.env.MEMBERSHIP_PRICE_WEI) : undefined;
  const duration = process.env.MEMBERSHIP_DURATION_SECS ? Number(process.env.MEMBERSHIP_DURATION_SECS) : undefined;
  if (price !== undefined && duration && duration > 0) {
    const tx = await (contrato as any).crearNivel(price, duration);
    await tx.wait();
    console.log("Nivel por defecto creado precioWei=", price.toString(), "duracion=", duration);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

import { ethers } from "hardhat";

async function main() {
  const address = process.env.CONTRACT_ADDRESS;
  const base = process.env.MEMBERSHIP_BASEURI;
  if (!address || !base) throw new Error("CONTRACT_ADDRESS y MEMBERSHIP_BASEURI requeridos");
  const C = await ethers.getContractFactory("AlturaNFTPasss");
  const c = C.attach(address);
  const tx = await (c as any).establecerBaseURI(base);
  await tx.wait();
  console.log("BaseURI establecido a:", base);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

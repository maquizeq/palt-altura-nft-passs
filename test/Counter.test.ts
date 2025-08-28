import { expect } from "chai";
import { ethers } from "hardhat";

// Nota: este suite es legacy y no corresponde al contrato actual de membresías.
// Lo dejamos marcado como skip para no ejecutarlo en el flujo actual.
describe.skip("Contador", function () {
  it("incrementa y decrementa", async function () {
    const Factory = await ethers.getContractFactory("Contador");
    const c = await Factory.deploy();
    await c.waitForDeployment();

    expect(await c.obtener()).to.equal(0n);

    await (await c.incrementar()).wait();
    expect(await c.obtener()).to.equal(1n);

    await (await c.decrementar()).wait();
    expect(await c.obtener()).to.equal(0n);
  });

  it("revierte por underflow", async function () {
    const Factory = await ethers.getContractFactory("Contador");
    const c = await Factory.deploy();
    await c.waitForDeployment();

  await expect(c.decrementar()).to.be.revertedWith("Contador: underflow");
  });
});

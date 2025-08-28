import { expect } from "chai";
import { ethers } from "hardhat";

describe("AlturaNFTPasss (ES)", () => {
	async function deployFixture() {
		const [owner, user, other] = await ethers.getSigners();
		const Factory = await ethers.getContractFactory("AlturaNFTPasss");
		const membership = await Factory.deploy("Altura NFT Passs", "ALTURA", "https://example.com/meta/", 100);
		await membership.waitForDeployment();
		return { owner, user, other, membership };
	}

	it("owner can create and update tier", async () => {
		const { membership, owner } = await deployFixture();
		const m: any = membership;
		const tx = await m.connect(owner).crearNivel(ethers.parseEther("0.01"), 7 * 24 * 60 * 60);
		await tx.wait();
		const nivel = await m.niveles(0);
		expect(nivel.precioWei).to.equal(ethers.parseEther("0.01"));
		expect(nivel.duracion).to.equal(7 * 24 * 60 * 60);
		expect(nivel.activo).to.equal(true);

		const upd = await m.actualizarNivel(0, ethers.parseEther("0.02"), 14 * 24 * 60 * 60, false);
		await upd.wait();
		const nivelU = await m.niveles(0);
		expect(nivelU.precioWei).to.equal(ethers.parseEther("0.02"));
		expect(nivelU.duracion).to.equal(14 * 24 * 60 * 60);
		expect(nivelU.activo).to.equal(false);
	});

	it("buy and renew membership", async () => {
		const { membership, owner, user } = await deployFixture();
		const m: any = membership;
		await (await m.connect(owner).crearNivel(ethers.parseEther("0.01"), 60)).wait();

		const now = (await ethers.provider.getBlock("latest"))!.timestamp;
		const buy = await m.connect(user).comprar(0, { value: ethers.parseEther("0.01") });
		const rc = await buy.wait();
		const parsed = rc!.logs.find((log: any) => log.fragment?.name === "MembresiaComprada");
		const tokenId = (parsed as any).args.tokenId as bigint;
		const expiry = await m.expiracionDe(tokenId);
		expect(expiry).to.be.greaterThan(now);
		expect(await m.tokenActivo(tokenId)).to.equal(true);

		// move time forward and renew
		await ethers.provider.send("evm_increaseTime", [30]);
		await ethers.provider.send("evm_mine", []);

		const before = await m.expiracionDe(tokenId);
		await (await m.connect(user).renovar(tokenId, { value: ethers.parseEther("0.01") })).wait();
		const after = await m.expiracionDe(tokenId);
		expect(after).to.be.greaterThan(before);
	});

	it("reverts on wrong price or inactive tier", async () => {
		const { membership, owner, user } = await deployFixture();
		const m: any = membership;
		await (await m.connect(owner).crearNivel(ethers.parseEther("0.01"), 60)).wait();
		await (await m.connect(owner).actualizarNivel(0, ethers.parseEther("0.01"), 60, false)).wait();
		await expect(m.connect(user).comprar(0, { value: ethers.parseEther("0.01") })).to.be.revertedWith("nivel inactivo");
	});

		it("enforces max supply", async () => {
			const { membership, owner, user, other } = await deployFixture();
			const m: any = membership;
			await (await m.connect(owner).crearNivel(ethers.parseEther("0.0"), 60)).wait();
			for (let i = 0; i < 100; i++) {
				await expect(m.connect(user).comprar(0, { value: 0 })).to.not.be.reverted;
			}
			await expect(m.connect(other).comprar(0, { value: 0 })).to.be.revertedWith("suministro agotado");
		});

	it("only owner/approved can renew", async () => {
		const { membership, owner, user, other } = await deployFixture();
		const m: any = membership;
		await (await m.connect(owner).crearNivel(ethers.parseEther("0.01"), 60)).wait();
		const buy = await m.connect(user).comprar(0, { value: ethers.parseEther("0.01") });
		const rc = await buy.wait();
		const parsed = rc!.logs.find((log: any) => log.fragment?.name === "MembresiaComprada");
		const tokenId = (parsed as any).args.tokenId as bigint;

		await expect(m.connect(other).renovar(tokenId, { value: ethers.parseEther("0.01") })).to.be.revertedWith("!autorizado");

		await (await m.connect(user).approve(other.address, tokenId)).wait();
		await expect(m.connect(other).renovar(tokenId, { value: ethers.parseEther("0.01") })).to.not.be.reverted;
	});
});


import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import 'dotenv/config'

const OUT = join(process.cwd(), "metadata");
const IMAGE_URI = process.env.MEMBERSHIP_IMAGE_URI || "ipfs://REEMPLAZA_CID_IMAGEN";
const NAME = process.env.MEMBERSHIP_NAME || "Altura NFT Passs";
const DESC = process.env.MEMBERSHIP_DESC || "Membresía de Altura";
const COUNT = Number(process.env.MEMBERSHIP_COUNT || 100);

mkdirSync(OUT, { recursive: true });
for (let i = 1; i <= COUNT; i++) {
  const data = {
    name: `${NAME} #${i}`,
    description: DESC,
    image: IMAGE_URI,
    attributes: [
      { trait_type: "Colección", value: NAME },
    ],
  };
  writeFileSync(join(OUT, `${i}.json`), JSON.stringify(data, null, 2));
}
console.log(`Generados ${COUNT} archivos en ${OUT}`);

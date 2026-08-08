import { hashPin } from "../lib/auth";

const pin = process.argv[2];
if (!pin || !/^\d{4,6}$/.test(pin)) {
  console.error("Pakai: npx tsx scripts/hash-pin.ts <PIN 4-6 digit>");
  process.exit(1);
}

const hash = hashPin(pin);
console.log("Tempel baris ini ke .env:\n");
console.log(`PIN_HASH="${hash}"`);

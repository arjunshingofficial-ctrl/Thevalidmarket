const { normalizeImageUrl } = require("./src/lib/storage/client");

// Setup env mock
process.env.NEXT_PUBLIC_STORAGE_ENDPOINT = "https://dvtmzispblbufuzoimkk.storage.supabase.co/storage/v1/s3";
process.env.NEXT_PUBLIC_STORAGE_BUCKET = "asia-d-market";

const PROJECT_REF = "dvtmzispblbufuzoimkk";
const BUCKET = "asia-d-market";

const cases = [
  { name: "CASE 1", input: "public/uploads/file.png" },
  { name: "CASE 2", input: "/public/uploads/file.png" },
  { name: "CASE 3", input: "uploads/file.png" },
  { name: "CASE 4", input: `https://${PROJECT_REF}.supabase.co/storage/v1/object/public/${BUCKET}/public/uploads/file.png` },
  { name: "CASE 5", input: `https://${PROJECT_REF}.storage.supabase.co/storage/v1/s3/${BUCKET}/public/uploads/file.png` },
  { name: "CASE 6", input: `https://${PROJECT_REF}.storage.supabase.co/storage/v1/object/public/${BUCKET}/public/uploads/file.png` },
  { name: "CASE 7", input: "data:image/png;base64,123" },
  { name: "CASE 8", input: "blob:https://localhost:3000/123" },
  { name: "CASE 9", input: "https://example.com/image.png" }, // External
];

for (const c of cases) {
  console.log(`${c.name}:`);
  console.log(`  IN:  ${c.input}`);
  console.log(`  OUT: ${normalizeImageUrl(c.input)}`);
  console.log();
}

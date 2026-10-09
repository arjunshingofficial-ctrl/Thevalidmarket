const { normalizeImageUrl } = require('./src/lib/storage/client.ts');
const urls = [
  'https://dvtmzispblbufuzoimkk.storage.supabase.co/storage/v1/object/public/asia-d-market/public/uploads/pexels-kienvirak-4826377-794568f0.jpg',
  '/media/ChatGPT Image Sep 18, 2026, 12_28_17 PM-aa7e95b8.png',
  'https://dvtmzispblbufuzoimkk.storage.supabase.co/storage/v1/s3/asia-d-market/public/uploads/ChatGPT-Image-Sep-18--2026--12-56-21-PM.png',
];

console.log(urls.map(normalizeImageUrl));

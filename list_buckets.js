const { S3Client, ListBucketsCommand } = require("@aws-sdk/client-s3");
const client = new S3Client({
  region: "auto",
  endpoint: "https://dvtmzispblbufuzoimkk.supabase.co/storage/v1/s3",
  credentials: {
    accessKeyId: "99b4bfe0987dd87a9a9bb03d86f0025c",
    secretAccessKey: "34fac3c2efd8969e87ee84029c49bb22d17beaea442c46d6854353f5f00f0dfd"
  },
  forcePathStyle: true,
});

async function main() {
  const data = await client.send(new ListBucketsCommand({}));
  console.log("Buckets:", data.Buckets.map(b => b.Name));
}
main().catch(console.error);

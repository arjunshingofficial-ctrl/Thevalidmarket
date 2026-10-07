const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const products = [
  {
    name: "RDP Starter", price: 8, badge: null,
    specs: { cpu: "2 vCPU", ram: "4 GB RAM", storage: "60 GB SSD", os: "Windows Server", users: "1 user", desc: "Basic remote desktop plan" }
  },
  {
    name: "RDP Basic", price: 12, badge: null,
    specs: { cpu: "2 vCPU", ram: "4 GB RAM", storage: "80 GB SSD", os: "Windows Server", users: "1 user", desc: "Suitable for basic desktop work" }
  },
  {
    name: "RDP Standard", price: 18, badge: "POPULAR",
    specs: { cpu: "4 vCPU", ram: "8 GB RAM", storage: "100 GB SSD", os: "Windows Server", users: "1 user", desc: "General productivity/server usage" }
  },
  {
    name: "RDP Pro", price: 25, badge: "BEST VALUE",
    specs: { cpu: "4 vCPU", ram: "8 GB RAM", storage: "150 GB SSD", os: "Windows Server", users: "2 users", desc: "Better performance for heavier workloads" }
  },
  {
    name: "RDP Business", price: 35, badge: null,
    specs: { cpu: "6 vCPU", ram: "12 GB RAM", storage: "200 GB SSD", os: "Windows Server", users: "2 users", desc: "Business/workstation usage" }
  },
  {
    name: "RDP Performance", price: 45, badge: null,
    specs: { cpu: "6 vCPU", ram: "16 GB RAM", storage: "250 GB SSD", os: "Windows Server", users: "2 users", desc: "Performance-focused remote desktop" }
  },
  {
    name: "RDP Advanced", price: 60, badge: null,
    specs: { cpu: "8 vCPU", ram: "16 GB RAM", storage: "300 GB SSD", os: "Windows Server", users: "3 users", desc: "Advanced workloads" }
  },
  {
    name: "RDP Power", price: 80, badge: "HIGH PERFORMANCE",
    specs: { cpu: "8 vCPU", ram: "32 GB RAM", storage: "400 GB SSD", os: "Windows Server", users: "4 users", desc: "High-performance remote desktop" }
  },
  {
    name: "RDP Enterprise", price: 110, badge: null,
    specs: { cpu: "12 vCPU", ram: "32 GB RAM", storage: "500 GB SSD", os: "Windows Server", users: "5 users", desc: "Enterprise-oriented workload" }
  },
  {
    name: "RDP Ultimate", price: 150, badge: "PREMIUM",
    specs: { cpu: "16 vCPU", ram: "64 GB RAM", storage: "1 TB SSD", os: "Windows Server", users: "5 users", desc: "Maximum-performance remote desktop plan" }
  }
];

async function main() {
  let category = await prisma.category.findUnique({ where: { slug: "rdp" } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: "RDP", slug: "rdp", description: "Remote Desktop Plans", isActive: true }
    });
  }

  for (const p of products) {
    const slug = p.name.toLowerCase().replace(/ /g, "-");
    const metadata = JSON.stringify({
      image: "/images/products/rdp-server.jpg",
      specs: p.specs,
      badge: p.badge,
      billing: "/month"
    });

    const exists = await prisma.product.findUnique({ where: { slug } });
    if (!exists) {
      await prisma.product.create({
        data: {
          categoryId: category.id,
          name: p.name,
          slug,
          type: "SUBSCRIPTION",
          description: p.specs.desc,
          shortDesc: p.specs.desc,
          price: p.price,
          status: "PUBLISHED",
          metadata
        }
      });
      console.log("Created", p.name);
    } else {
      await prisma.product.update({
        where: { slug },
        data: { metadata, price: p.price, description: p.specs.desc, shortDesc: p.specs.desc }
      });
      console.log("Updated", p.name);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

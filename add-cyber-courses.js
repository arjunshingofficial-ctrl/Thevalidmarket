const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get Courses category
  let coursesCategory = await prisma.category.findUnique({
    where: { slug: "courses" }
  });
  
  if (!coursesCategory) {
    // maybe it's called 'course'
    coursesCategory = await prisma.category.findUnique({
      where: { slug: "course" }
    });
  }
  
  if (!coursesCategory) {
    coursesCategory = await prisma.category.create({
      data: {
        name: "Courses",
        slug: "courses",
        displayMode: "GRID"
      }
    });
    console.log("Created Courses category");
  } else {
    console.log(`Found category: ${coursesCategory.name}`);
  }

  const courseNames = [
    "Complete Ethical Hacking Masterclass",
    "CompTIA Security+ Certification Prep",
    "Web Application Penetration Testing",
    "Network Security Fundamentals",
    "Certified Information Systems Security Professional (CISSP)",
    "Python for Cybersecurity",
    "Digital Forensics and Incident Response",
    "Zero Trust Architecture Design",
    "Cloud Security AWS & Azure",
    "Malware Analysis and Reverse Engineering"
  ];
  
  console.log("Generating 10 Cyber Security Courses...");
  
  for (const name of courseNames) {
    const price = Math.floor(Math.random() * 11) + 20; // 20 to 30
    
    // Create Product
    await prisma.product.create({
      data: {
        name,
        slug: `cyber-security-course-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        categoryId: coursesCategory.id,
        type: "COURSE",
        price,
        status: "PUBLISHED",
        description: `Comprehensive training for ${name}. Master the skills needed to protect digital assets and infrastructure.`
      }
    });
  }
  
  console.log("Successfully created 10 Cyber Security Courses!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { 
    console.error(e); 
    prisma.$disconnect(); 
  });

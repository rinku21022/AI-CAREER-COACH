"use strict";
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a test user (you can adjust this to match your needs)
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      clerkUserId: 'user_2ZYxd5WQONJxTb75k8jQvKMVPwn', // replace with an actual Clerk user ID if needed
      email: 'test@example.com',
      name: 'Test User',
      industry: 'tech',
      bio: 'Software developer with 5 years of experience',
      experience: 5,
      skillsString: 'JavaScript,React,Node.js,Next.js,TypeScript',
    }
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

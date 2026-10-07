import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function generateUserId(): string {
  // Generate a random number between 10000000 and 99999999
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

async function main() {
  console.log('Starting User ID backfill...');

  const usersWithoutId = await prisma.user.findMany({
    where: { accountId: null }
  });

  console.log(`Found ${usersWithoutId.length} users needing an account ID.`);

  for (const user of usersWithoutId) {
    let assigned = false;
    let attempts = 0;
    
    while (!assigned && attempts < 10) {
      attempts++;
      const newId = generateUserId();
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { accountId: newId }
        });
        console.log(`Assigned ${newId} to user ${user.id}`);
        assigned = true;
      } catch (e: any) {
        // Unique constraint failed, try again
        if (e.code === 'P2002') {
          console.log(`Collision for ${newId}, retrying...`);
        } else {
          console.error(`Error updating user ${user.id}:`, e);
          break;
        }
      }
    }
    
    if (!assigned) {
      console.error(`Failed to assign ID to user ${user.id} after 10 attempts.`);
    }
  }

  console.log('Backfill complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

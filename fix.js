const fs = require('fs');
const text = fs.readFileSync('prisma/schema.prisma', 'utf8');
const lines = text.split('\n');
const cleanLines = lines.slice(0, 828);

const appended = `
// ----------------------------------------------------------------------
// COMMUNITY CHAT SYSTEM
// ----------------------------------------------------------------------

model ChatMessage {
  id        String   @id @default(cuid())
  userId    String
  message   String
  status    String   @default("ACTIVE") // ACTIVE, HIDDEN, DELETED
  isAdmin   Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model ChatReport {
  id         String   @id @default(cuid())
  messageId  String
  reporterId String
  reason     String
  status     String   @default("PENDING") // PENDING, REVIEWED, RESOLVED
  createdAt  DateTime @default(now())

  message    ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  reporter   User        @relation(fields: [reporterId], references: [id], onDelete: Cascade)
}
`;

fs.writeFileSync('prisma/schema.prisma', cleanLines.join('\n') + appended);
console.log('Fixed');

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskflow.io' },
    update: {},
    create: { name: 'Admin User', email: 'admin@taskflow.io', passwordHash: adminHash, role: 'ADMIN' },
  });

  // Create member user
  const memberHash = await bcrypt.hash('member123', 12);
  const member = await prisma.user.upsert({
    where: { email: 'member@taskflow.io' },
    update: {},
    create: { name: 'Jane Member', email: 'member@taskflow.io', passwordHash: memberHash, role: 'MEMBER' },
  });

  // Create a sample project
  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'Website Redesign',
      description: 'Redesign the company website with a modern look and feel.',
      ownerId: admin.id,
      members: {
        create: [
          { userId: admin.id, role: 'ADMIN' },
          { userId: member.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create sample tasks
  const tasks = [
    { title: 'Set up project structure', status: 'DONE', priority: 'HIGH', assigneeId: admin.id },
    { title: 'Design wireframes', status: 'DONE', priority: 'HIGH', assigneeId: member.id },
    { title: 'Build homepage component', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: member.id },
    { title: 'Implement authentication', status: 'IN_PROGRESS', priority: 'MEDIUM', assigneeId: admin.id },
    { title: 'Write API documentation', status: 'TODO', priority: 'MEDIUM', assigneeId: null },
    { title: 'Deploy to production', status: 'TODO', priority: 'HIGH', assigneeId: admin.id,
      dueDate: new Date(Date.now() - 86400000) }, // overdue
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, projectId: project.id, createdById: admin.id },
    });
  }

  console.log('✅ Seed complete!');
  console.log('   Admin:  admin@taskflow.io  / admin123');
  console.log('   Member: member@taskflow.io / member123');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

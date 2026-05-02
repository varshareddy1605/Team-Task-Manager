const prisma = require('../lib/prisma');

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

    const projectFilter = isAdmin
      ? {}
      : {
          project: {
            OR: [
              { ownerId: userId },
              { members: { some: { userId } } },
            ],
          },
        };

    const [totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myTasks, recentTasks, projectCount] =
      await Promise.all([
        prisma.task.count({ where: projectFilter }),
        prisma.task.count({ where: { ...projectFilter, status: 'TODO' } }),
        prisma.task.count({ where: { ...projectFilter, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { ...projectFilter, status: 'DONE' } }),
        prisma.task.count({
          where: {
            ...projectFilter,
            status: { not: 'DONE' },
            dueDate: { lt: new Date() },
          },
        }),
        prisma.task.count({ where: { assigneeId: userId } }),
        prisma.task.findMany({
          where: projectFilter,
          include: {
            assignee: { select: { id: true, name: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        isAdmin
          ? prisma.project.count()
          : prisma.project.count({
              where: {
                OR: [{ ownerId: userId }, { members: { some: { userId } } }],
              },
            }),
      ]);

    res.json({
      stats: { totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, myTasks, projectCount },
      recentTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboard };

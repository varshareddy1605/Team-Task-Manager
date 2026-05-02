const prisma = require('../lib/prisma');
const { validationResult } = require('express-validator');

// GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assigneeId } = req.query;

    const where = {};

    // Only show tasks from projects the user is part of
    if (req.user.role !== 'ADMIN') {
      where.project = {
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } },
        ],
      };
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, projectId, assigneeId, priority, dueDate } = req.body;

  try {
    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: req.user.id } },
    });
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const hasAccess = project.ownerId === req.user.id || membership || req.user.role === 'ADMIN';
    if (!hasAccess) return res.status(403).json({ error: 'Access denied' });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Members can update status of their own tasks; Admins can update anything
    const isAdmin = req.user.role === 'ADMIN' || task.createdById === req.user.id;
    const isAssignee = task.assigneeId === req.user.id;

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { title, description, assigneeId, status, priority, dueDate } = req.body;

    // Members can only update status
    const data = isAdmin
      ? { 
          title, description, 
          assigneeId: assigneeId || null, 
          status, priority, 
          dueDate: dueDate ? new Date(dueDate) : null 
        }
      : { status };

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data,
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });
    res.json({ task: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const isAdmin = req.user.role === 'ADMIN' || task.createdById === req.user.id;
    if (!isAdmin) return res.status(403).json({ error: 'Admin access required' });

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };

const express = require('express');
const { body } = require('express-validator');
const {
  getProjects, getProject, createProject, updateProject, deleteProject,
  getMembers, addMember, removeMember,
} = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/', getProjects);
router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], createProject);
router.get('/:id', getProject);
router.put('/:id', [
  body('name').trim().notEmpty().withMessage('Project name is required'),
], updateProject);
router.delete('/:id', deleteProject);

router.get('/:id/members', getMembers);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;

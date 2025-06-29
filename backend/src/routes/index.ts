import express, { Router } from 'express';
import authRoutes from './auth';
import promptRoutes from './prompts';
import versionRoutes from './versions';
import teamsRoutes from './teams';
import commentsRoutes from './comments';
import aiRoutes from './ai';
import categoriesRoutes from './categories';
import projectsRoutes from './projects';
import adminRoutes from './admin';

const router: Router = express.Router();

router.use('/auth', authRoutes);
router.use('/prompts', promptRoutes);
router.use('/teams', teamsRoutes);
router.use('/comments', commentsRoutes);
router.use('/ai', aiRoutes);
router.use('/categories', categoriesRoutes);
router.use('/projects', projectsRoutes);
router.use('/admin', adminRoutes);
router.use('/', versionRoutes);

export default router;
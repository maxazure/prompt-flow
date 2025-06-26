import express, { Router } from 'express';
import authRoutes from './auth';
import promptRoutes from './prompts';
import versionRoutes from './versions';
import teamsRoutes from './teams';
import commentsRoutes from './comments';
import aiRoutes from './ai';
import categoriesRoutes from './categories';

const router: Router = express.Router();

router.use('/auth', authRoutes);
router.use('/prompts', promptRoutes);
router.use('/teams', teamsRoutes);
router.use('/comments', commentsRoutes);
router.use('/ai', aiRoutes);
router.use('/categories', categoriesRoutes);
router.use('/', versionRoutes);

export default router;
import express, { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Category } from '../models';
import { createUncategorizedCategory, getUncategorizedCategory } from '../services/uncategorizedService';

const router: Router = express.Router();

// Check uncategorized categories status for all users
router.get('/check-uncategorized', async (req: Request, res: Response) => {
  try {
    console.log('🔍 Admin: Checking uncategorized categories status...');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email']
    });

    // Get all uncategorized categories
    const uncategorizedCategories = await Category.findAll({
      where: {
        name: '未分类',
        scopeType: 'personal',
        isActive: true
      }
    });

    const results = [];
    let missingCount = 0;

    for (const user of users) {
      const hasUncategorized = uncategorizedCategories.find(cat => cat.scopeId === user.id);
      
      if (hasUncategorized) {
        results.push({
          userId: user.id,
          username: user.username,
          email: user.email,
          hasUncategorized: true,
          categoryId: hasUncategorized.id,
          categoryName: hasUncategorized.name
        });
      } else {
        results.push({
          userId: user.id,
          username: user.username,
          email: user.email,
          hasUncategorized: false,
          categoryId: null,
          categoryName: null
        });
        missingCount++;
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalUsers: users.length,
        usersWithUncategorized: users.length - missingCount,
        usersMissingUncategorized: missingCount,
        totalUncategorizedCategories: uncategorizedCategories.length
      },
      results
    });

  } catch (error) {
    console.error('❌ Admin check error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check uncategorized categories status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Initialize uncategorized categories for all existing users
router.post('/initialize-uncategorized', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Admin: Starting initialization of uncategorized categories...');

    // Get all existing users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email']
    });

    console.log(`📊 Found ${users.length} users`);

    let created = 0;
    let skipped = 0;
    const results = [];

    for (const user of users) {
      try {
        // Check if user already has an uncategorized category
        const existingCategory = await getUncategorizedCategory(user.id);
        
        if (existingCategory) {
          console.log(`✓ User ${user.username} (ID: ${user.id}) already has uncategorized category (ID: ${existingCategory.id})`);
          results.push({
            userId: user.id,
            username: user.username,
            status: 'skipped',
            categoryId: existingCategory.id,
            message: 'Already has uncategorized category'
          });
          skipped++;
        } else {
          // Create uncategorized category for this user
          const newCategory = await createUncategorizedCategory(user.id);
          console.log(`🆕 Created uncategorized category for user ${user.username} (ID: ${user.id}) - Category ID: ${newCategory.id}`);
          results.push({
            userId: user.id,
            username: user.username,
            status: 'created',
            categoryId: newCategory.id,
            message: 'Successfully created uncategorized category'
          });
          created++;
        }
      } catch (error) {
        console.error(`❌ Failed to create uncategorized category for user ${user.username} (ID: ${user.id}):`, error);
        results.push({
          userId: user.id,
          username: user.username,
          status: 'error',
          categoryId: null,
          message: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`\n📈 Initialization completed:`);
    console.log(`  🆕 Created: ${created} new uncategorized categories`);
    console.log(`  ⏭️  Skipped: ${skipped} users (already had uncategorized category)`);
    console.log(`  📊 Total users processed: ${users.length}`);

    res.status(200).json({
      success: true,
      message: 'Uncategorized categories initialization completed',
      summary: {
        totalUsers: users.length,
        created,
        skipped,
        errors: results.filter(r => r.status === 'error').length
      },
      results
    });

  } catch (error) {
    console.error('❌ Admin initialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to initialize uncategorized categories',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Reset password for existing users to enable testing
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, newPassword } = req.body;
    
    if (!email || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and newPassword are required'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await user.update({ password: hashedPassword });

    console.log(`🔑 Admin: Password reset for user ${user.username} (${user.email})`);

    res.status(200).json({
      success: true,
      message: `Password reset successfully for user ${user.username}`,
      userId: user.id,
      username: user.username,
      email: user.email
    });

  } catch (error) {
    console.error('❌ Admin password reset error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
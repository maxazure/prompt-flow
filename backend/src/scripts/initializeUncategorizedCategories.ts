import { sequelize } from '../config/database';
import { User } from '../models/User';
import { createUncategorizedCategory, getUncategorizedCategory } from '../services/uncategorizedService';

/**
 * Initialize uncategorized categories for all existing users
 * This script should be run once after implementing the uncategorized category system
 */
export const initializeUncategorizedCategories = async (): Promise<void> => {
  try {
    console.log('Starting initialization of uncategorized categories...');

    // Get all existing users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email']
    });

    console.log(`Found ${users.length} users`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Check if user already has an uncategorized category
        const existingCategory = await getUncategorizedCategory(user.id);
        
        if (existingCategory) {
          console.log(`✓ User ${user.username} (ID: ${user.id}) already has uncategorized category`);
          skipped++;
        } else {
          // Create uncategorized category for this user
          const newCategory = await createUncategorizedCategory(user.id);
          console.log(`✓ Created uncategorized category for user ${user.username} (ID: ${user.id}) - Category ID: ${newCategory.id}`);
          created++;
        }
      } catch (error) {
        console.error(`✗ Failed to create uncategorized category for user ${user.username} (ID: ${user.id}):`, error);
      }
    }

    console.log(`\nInitialization completed:`);
    console.log(`- Created: ${created} new uncategorized categories`);
    console.log(`- Skipped: ${skipped} users (already had uncategorized category)`);
    console.log(`- Total users processed: ${users.length}`);

  } catch (error) {
    console.error('Error during uncategorized categories initialization:', error);
    throw error;
  }
};

// If this script is run directly
if (require.main === module) {
  (async () => {
    try {
      // Initialize database connection
      await sequelize.authenticate();
      console.log('Database connection established');

      // Run the initialization
      await initializeUncategorizedCategories();

      // Close database connection
      await sequelize.close();
      console.log('Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('Script execution failed:', error);
      process.exit(1);
    }
  })();
}
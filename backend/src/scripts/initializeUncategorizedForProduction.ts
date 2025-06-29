import { sequelize } from '../config/database';
import { User, Category } from '../models';
import { createUncategorizedCategory, getUncategorizedCategory } from '../services/uncategorizedService';

/**
 * Initialize uncategorized categories for all existing users in production
 * This script handles PostgreSQL database
 */
export const initializeUncategorizedForProduction = async (): Promise<void> => {
  try {
    console.log('🚀 Starting initialization of uncategorized categories for production...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Get all existing users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email']
    });

    console.log(`📊 Found ${users.length} users in production database`);

    let created = 0;
    let skipped = 0;

    for (const user of users) {
      try {
        // Check if user already has an uncategorized category
        const existingCategory = await getUncategorizedCategory(user.id);
        
        if (existingCategory) {
          console.log(`✓ User ${user.username} (ID: ${user.id}) already has uncategorized category (ID: ${existingCategory.id})`);
          skipped++;
        } else {
          // Create uncategorized category for this user
          const newCategory = await createUncategorizedCategory(user.id);
          console.log(`🆕 Created uncategorized category for user ${user.username} (ID: ${user.id}) - Category ID: ${newCategory.id}`);
          created++;
        }
      } catch (error) {
        console.error(`❌ Failed to create uncategorized category for user ${user.username} (ID: ${user.id}):`, error);
      }
    }

    console.log(`\n📈 Production initialization completed:`);
    console.log(`  🆕 Created: ${created} new uncategorized categories`);
    console.log(`  ⏭️  Skipped: ${skipped} users (already had uncategorized category)`);
    console.log(`  📊 Total users processed: ${users.length}`);

    // Show final category count
    const totalCategories = await Category.count({
      where: {
        name: '未分类',
        scopeType: 'personal',
        isActive: true
      }
    });
    console.log(`\n🎯 Total uncategorized categories in database: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error during production uncategorized categories initialization:', error);
    throw error;
  }
};

// If this script is run directly
if (require.main === module) {
  // Force PostgreSQL for production
  process.env.DATABASE_TYPE = 'postgres';
  console.log('🔧 Forcing PostgreSQL connection for production script');
  
  (async () => {
    try {
      // Run the initialization
      await initializeUncategorizedForProduction();

      // Close database connection
      await sequelize.close();
      console.log('✅ Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('💥 Script execution failed:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}
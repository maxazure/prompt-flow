import { sequelize } from '../config/database';
import { Prompt, Category, User, CategoryScopeType } from '../models';
import { Op, QueryTypes } from 'sequelize';

interface MigrationResult {
  totalPrompts: number;
  migratedPrompts: number;
  categoriesCreated: number;
  existingCategories: number;
  errors: string[];
}

/**
 * Migrates existing category strings to categoryId references
 * Creates new Category records for unique category strings and updates Prompt records
 */
export async function migrateCategoryData(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalPrompts: 0,
    migratedPrompts: 0,
    categoriesCreated: 0,
    existingCategories: 0,
    errors: [],
  };

  try {
    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      console.log('🔄 Starting category data migration...');

      // Get all prompts that have string categories but no categoryId
      const promptsToMigrate = await sequelize.query(`
        SELECT p.*, u.username
        FROM prompts p
        LEFT JOIN users u ON p."userId" = u.id
        WHERE p.category IS NOT NULL 
        AND p."categoryId" IS NULL
      `, { 
        type: QueryTypes.SELECT,
        transaction,
        model: Prompt,
        mapToModel: true
      }) as Prompt[];

      result.totalPrompts = promptsToMigrate.length;
      console.log(`📊 Found ${result.totalPrompts} prompts to migrate`);

      if (result.totalPrompts === 0) {
        console.log('✅ No prompts need migration');
        await transaction.commit();
        return result;
      }

      // Group prompts by category string
      const categoryGroups = new Map<string, typeof promptsToMigrate>();
      promptsToMigrate.forEach(prompt => {
        const categoryName = prompt.category!;
        if (!categoryGroups.has(categoryName)) {
          categoryGroups.set(categoryName, []);
        }
        categoryGroups.get(categoryName)!.push(prompt);
      });

      console.log(`🏷️  Found ${categoryGroups.size} unique categories to process`);

      // Process each category group
      for (const [categoryName, prompts] of categoryGroups) {
        try {
          console.log(`🔄 Processing category: "${categoryName}" (${prompts.length} prompts)`);

          // Check if category already exists
          let category = await Category.findOne({
            where: {
              name: categoryName,
              scopeType: CategoryScopeType.PUBLIC,
            },
            transaction,
          });

          if (category) {
            result.existingCategories++;
            console.log(`   ✅ Using existing category: ${category.id}`);
          } else {
            // Create new public category
            // Use the first prompt's creator as the category creator
            const firstPrompt = prompts[0];
            category = await Category.create({
              name: categoryName,
              description: `Migrated from legacy category string: ${categoryName}`,
              scopeType: CategoryScopeType.PUBLIC,
              createdBy: firstPrompt.userId,
              isActive: true,
            }, { transaction });

            result.categoriesCreated++;
            console.log(`   ✅ Created new category: ${category.id}`);
          }

          // Update all prompts in this category group
          for (const prompt of prompts) {
            try {
              await prompt.update({
                categoryId: category.id,
                // Keep the original category string for backward compatibility
                // category: prompt.category (leave as is)
              }, { transaction });

              result.migratedPrompts++;
              console.log(`   📝 Updated prompt ${prompt.id}: "${prompt.title}"`);
            } catch (error) {
              const errorMsg = `Failed to update prompt ${prompt.id}: ${error}`;
              result.errors.push(errorMsg);
              console.error(`   ❌ ${errorMsg}`);
            }
          }

        } catch (error) {
          const errorMsg = `Failed to process category "${categoryName}": ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      await transaction.commit();
      console.log('✅ Migration completed successfully');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

  } catch (error) {
    const errorMsg = `Migration failed: ${error}`;
    result.errors.push(errorMsg);
    console.error(`❌ ${errorMsg}`);
    throw error;
  }

  return result;
}

/**
 * Validates the migration by checking data consistency
 */
export async function validateMigration(): Promise<{
  isValid: boolean;
  issues: string[];
  statistics: {
    totalPrompts: number;
    promptsWithCategoryId: number;
    promptsWithLegacyCategory: number;
    promptsWithBoth: number;
    orphanedPrompts: number;
  };
}> {
  const issues: string[] = [];
  
  try {
    // Get statistics using raw SQL for better type safety
    const statsQueries = await Promise.all([
      sequelize.query('SELECT COUNT(*) as count FROM prompts', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM prompts WHERE "categoryId" IS NOT NULL', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM prompts WHERE category IS NOT NULL', { type: QueryTypes.SELECT }),
      sequelize.query('SELECT COUNT(*) as count FROM prompts WHERE category IS NOT NULL AND "categoryId" IS NOT NULL', { type: QueryTypes.SELECT }),
    ]) as Array<Array<{ count: string }>>;

    const totalPrompts = parseInt(statsQueries[0][0]?.count || '0');
    const promptsWithCategoryId = parseInt(statsQueries[1][0]?.count || '0');
    const promptsWithLegacyCategory = parseInt(statsQueries[2][0]?.count || '0');
    const promptsWithBoth = parseInt(statsQueries[3][0]?.count || '0');

    // Check for orphaned prompts (categoryId points to non-existent category)
    const orphanedPromptsResult = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM prompts p
      LEFT JOIN categories c ON p."categoryId" = c.id
      WHERE p."categoryId" IS NOT NULL AND c.id IS NULL
    `, { type: QueryTypes.SELECT }) as Array<{ count: string }>;
    
    const orphanedPrompts = parseInt(orphanedPromptsResult[0]?.count || '0');

    const statistics = {
      totalPrompts,
      promptsWithCategoryId,
      promptsWithLegacyCategory,
      promptsWithBoth,
      orphanedPrompts,
    };

    // Validation checks
    if (orphanedPrompts > 0) {
      issues.push(`Found ${orphanedPrompts} prompts with invalid categoryId references`);
    }

    // Check for duplicate category names (should be handled by unique constraints)
    const duplicateCategories = await sequelize.query(`
      SELECT name, COUNT(*) as count 
      FROM categories 
      WHERE "scopeType" = 'public' 
      GROUP BY name 
      HAVING COUNT(*) > 1
    `, { type: QueryTypes.SELECT }) as Array<{ name: string; count: string }>;

    if (duplicateCategories.length > 0) {
      issues.push(`Found duplicate public category names: ${duplicateCategories.map(c => `${c.name} (${c.count})`).join(', ')}`);
    }

    console.log('📊 Migration Validation Results:');
    console.log(`   Total prompts: ${statistics.totalPrompts}`);
    console.log(`   Prompts with categoryId: ${statistics.promptsWithCategoryId}`);
    console.log(`   Prompts with legacy category: ${statistics.promptsWithLegacyCategory}`);
    console.log(`   Prompts with both: ${statistics.promptsWithBoth}`);
    console.log(`   Orphaned prompts: ${statistics.orphanedPrompts}`);
    console.log(`   Issues found: ${issues.length}`);

    return {
      isValid: issues.length === 0,
      issues,
      statistics,
    };

  } catch (error) {
    issues.push(`Validation failed: ${error}`);
    return {
      isValid: false,
      issues,
      statistics: {
        totalPrompts: 0,
        promptsWithCategoryId: 0,
        promptsWithLegacyCategory: 0,
        promptsWithBoth: 0,
        orphanedPrompts: 0,
      },
    };
  }
}

/**
 * CLI script runner
 */
async function runMigration() {
  try {
    console.log('🚀 Starting category data migration script');
    
    // Ensure database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Run migration
    const result = await migrateCategoryData();
    
    console.log('\n📋 Migration Summary:');
    console.log(`   Total prompts processed: ${result.totalPrompts}`);
    console.log(`   Prompts migrated: ${result.migratedPrompts}`);
    console.log(`   Categories created: ${result.categoriesCreated}`);
    console.log(`   Existing categories used: ${result.existingCategories}`);
    console.log(`   Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

    // Validate migration
    console.log('\n🔍 Validating migration...');
    const validation = await validateMigration();
    
    if (validation.isValid) {
      console.log('✅ Migration validation passed');
    } else {
      console.log('❌ Migration validation failed:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    process.exit(validation.isValid ? 0 : 1);

  } catch (error) {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  runMigration();
}
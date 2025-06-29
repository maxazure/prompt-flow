import { sequelize } from '../config/database';
import { User, Category, Prompt } from '../models';
import { getUncategorizedCategory } from '../services/uncategorizedService';

/**
 * Comprehensive validation of the uncategorized category system
 */
export const validateUncategorizedSystem = async (): Promise<void> => {
  try {
    console.log('🔍 Starting comprehensive validation of uncategorized category system...\n');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'createdAt']
    });

    console.log(`📊 Found ${users.length} users in the system\n`);

    let passedTests = 0;
    let totalTests = 0;

    for (const user of users) {
      console.log(`👤 Testing user: ${user.username} (ID: ${user.id}, Email: ${user.email})`);
      
      // Test 1: Check if user has uncategorized category
      totalTests++;
      const uncategorizedCategory = await getUncategorizedCategory(user.id);
      if (uncategorizedCategory) {
        console.log(`  ✅ Test 1 PASSED: Has uncategorized category (ID: ${uncategorizedCategory.id})`);
        passedTests++;

        // Validate category properties
        if (uncategorizedCategory.name === '未分类' &&
            uncategorizedCategory.scopeType === 'personal' &&
            uncategorizedCategory.scopeId === user.id &&
            uncategorizedCategory.createdBy === user.id &&
            uncategorizedCategory.color === '#6b7280' &&
            uncategorizedCategory.isActive === true) {
          console.log(`  ✅ Category properties are correct`);
        } else {
          console.log(`  ⚠️  Category properties need verification:`);
          console.log(`     Name: ${uncategorizedCategory.name} (expected: 未分类)`);
          console.log(`     ScopeType: ${uncategorizedCategory.scopeType} (expected: personal)`);
          console.log(`     ScopeId: ${uncategorizedCategory.scopeId} (expected: ${user.id})`);
          console.log(`     CreatedBy: ${uncategorizedCategory.createdBy} (expected: ${user.id})`);
          console.log(`     Color: ${uncategorizedCategory.color} (expected: #6b7280)`);
          console.log(`     IsActive: ${uncategorizedCategory.isActive} (expected: true)`);
        }
      } else {
        console.log(`  ❌ Test 1 FAILED: Missing uncategorized category`);
      }

      // Test 2: Check user's prompts and their category assignments
      totalTests++;
      const userPrompts = await Prompt.findAll({
        where: { userId: user.id },
        attributes: ['id', 'title', 'categoryId', 'createdAt']
      });

      console.log(`  📝 User has ${userPrompts.length} prompts`);
      
      if (userPrompts.length > 0) {
        let promptsWithCategory = 0;
        let promptsWithUncategorized = 0;
        let promptsWithoutCategory = 0;

        for (const prompt of userPrompts) {
          if (prompt.categoryId === uncategorizedCategory?.id) {
            promptsWithUncategorized++;
          } else if (prompt.categoryId) {
            promptsWithCategory++;
          } else {
            promptsWithoutCategory++;
          }
        }

        console.log(`    📊 Prompts with uncategorized: ${promptsWithUncategorized}`);
        console.log(`    📊 Prompts with other categories: ${promptsWithCategory}`);
        console.log(`    📊 Prompts without category: ${promptsWithoutCategory}`);

        if (promptsWithoutCategory === 0 || uncategorizedCategory) {
          console.log(`  ✅ Test 2 PASSED: Prompt categorization is working`);
          passedTests++;
        } else {
          console.log(`  ❌ Test 2 FAILED: Some prompts lack proper categorization`);
        }
      } else {
        console.log(`  ✅ Test 2 PASSED: No prompts to validate`);
        passedTests++;
      }

      console.log(''); // Empty line for readability
    }

    // Overall system tests
    console.log('🔍 Running system-wide tests...\n');

    // Test 3: Check for duplicate uncategorized categories
    totalTests++;
    const allUncategorizedCategories = await Category.findAll({
      where: {
        name: '未分类',
        scopeType: 'personal',
        isActive: true
      }
    });

    const uniqueUserIds = new Set(allUncategorizedCategories.map(cat => cat.scopeId));
    if (uniqueUserIds.size === allUncategorizedCategories.length) {
      console.log(`✅ Test 3 PASSED: No duplicate uncategorized categories found`);
      passedTests++;
    } else {
      console.log(`❌ Test 3 FAILED: Found duplicate uncategorized categories`);
      console.log(`   Total categories: ${allUncategorizedCategories.length}`);
      console.log(`   Unique users: ${uniqueUserIds.size}`);
    }

    // Test 4: Validate that each uncategorized category has correct permissions
    totalTests++;
    let permissionTestPassed = true;
    for (const category of allUncategorizedCategories) {
      if (category.scopeId !== category.createdBy) {
        console.log(`❌ Permission issue: Category ${category.id} scopeId (${category.scopeId}) != createdBy (${category.createdBy})`);
        permissionTestPassed = false;
      }
    }

    if (permissionTestPassed) {
      console.log(`✅ Test 4 PASSED: All uncategorized categories have correct permissions`);
      passedTests++;
    } else {
      console.log(`❌ Test 4 FAILED: Some categories have permission issues`);
    }

    // Final report
    console.log('\n📈 VALIDATION REPORT');
    console.log('='.repeat(50));
    console.log(`Total tests run: ${totalTests}`);
    console.log(`Tests passed: ${passedTests}`);
    console.log(`Tests failed: ${totalTests - passedTests}`);
    console.log(`Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Uncategorized category system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the issues above.');
    }

    console.log('\n📊 System Summary:');
    console.log(`   👥 Total users: ${users.length}`);
    console.log(`   📁 Total uncategorized categories: ${allUncategorizedCategories.length}`);
    console.log(`   🔗 Coverage: ${allUncategorizedCategories.length}/${users.length} users have uncategorized categories`);

  } catch (error) {
    console.error('❌ Validation error:', error);
    throw error;
  }
};

// If this script is run directly
if (require.main === module) {
  (async () => {
    try {
      await validateUncategorizedSystem();
      await sequelize.close();
      console.log('\n✅ Database connection closed');
      process.exit(0);
    } catch (error) {
      console.error('💥 Validation failed:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}
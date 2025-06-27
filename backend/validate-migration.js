const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔍 开始验证数据迁移结果...\n');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功\n');
});

// 验证步骤1: 基础数据统计
function validateBasicStats() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(*) as total_prompts,
        COUNT(CASE WHEN categoryId IS NOT NULL THEN 1 END) as with_categoryid,
        COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as with_legacy_category,
        COUNT(CASE WHEN category IS NOT NULL AND categoryId IS NOT NULL THEN 1 END) as with_both
      FROM prompts;
    `;
    
    db.get(query, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('📊 基础数据统计:');
      console.log(`   总提示词数量: ${row.total_prompts}`);
      console.log(`   包含 categoryId: ${row.with_categoryid}`);
      console.log(`   包含 legacy category: ${row.with_legacy_category}`);
      console.log(`   同时包含两者: ${row.with_both}`);
      
      // 验证迁移完整性
      const isComplete = row.with_categoryid === row.total_prompts && row.with_both === row.total_prompts;
      console.log(`   ✅ 迁移完整性: ${isComplete ? '通过' : '失败'}\n`);
      
      resolve({ isComplete, stats: row });
    });
  });
}

// 验证步骤2: 分类数据一致性
function validateCategoryConsistency() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.id, 
        p.title, 
        p.category as legacy_category, 
        p.categoryId as new_category_id,
        c.name as category_name,
        c.scopeType
      FROM prompts p
      LEFT JOIN categories c ON p.categoryId = c.id
      ORDER BY p.id;
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('🏷️ 分类数据一致性验证:');
      let consistencyIssues = 0;
      
      rows.forEach(row => {
        const isConsistent = row.legacy_category === row.category_name;
        if (!isConsistent) {
          console.log(`   ❌ 不一致: Prompt ${row.id} - Legacy: "${row.legacy_category}" vs New: "${row.category_name}"`);
          consistencyIssues++;
        }
      });
      
      if (consistencyIssues === 0) {
        console.log('   ✅ 所有提示词的分类数据一致');
      } else {
        console.log(`   ❌ 发现 ${consistencyIssues} 个不一致的记录`);
      }
      
      console.log(`   📝 验证了 ${rows.length} 条提示词记录\n`);
      
      resolve({ consistencyIssues, totalChecked: rows.length });
    });
  });
}

// 验证步骤3: 分类创建验证
function validateCategoriesCreated() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        id, 
        name, 
        scopeType, 
        description, 
        createdBy,
        createdAt
      FROM categories 
      ORDER BY id;
    `;
    
    db.all(query, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('🆕 创建的分类验证:');
      console.log(`   共创建 ${rows.length} 个分类:`);
      
      rows.forEach(category => {
        console.log(`   📁 ${category.id}: "${category.name}" (${category.scopeType}) - 创建者: ${category.createdBy}`);
      });
      
      console.log('');
      resolve({ categoriesCreated: rows.length, categories: rows });
    });
  });
}

// 验证步骤4: 孤儿记录检查
function validateOrphanedRecords() {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as orphaned_count
      FROM prompts p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.categoryId IS NOT NULL AND c.id IS NULL;
    `;
    
    db.get(query, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      console.log('🔗 孤儿记录检查:');
      if (row.orphaned_count === 0) {
        console.log('   ✅ 没有发现孤儿记录 (所有 categoryId 都有效)');
      } else {
        console.log(`   ❌ 发现 ${row.orphaned_count} 个孤儿记录`);
      }
      
      console.log('');
      resolve({ orphanedCount: row.orphaned_count });
    });
  });
}

// 主验证流程
async function runValidation() {
  try {
    const results = {};
    
    // 步骤1: 基础统计
    results.basicStats = await validateBasicStats();
    
    // 步骤2: 数据一致性
    results.consistency = await validateCategoryConsistency();
    
    // 步骤3: 分类创建
    results.categories = await validateCategoriesCreated();
    
    // 步骤4: 孤儿记录
    results.orphaned = await validateOrphanedRecords();
    
    // 生成最终报告
    console.log('📋 迁移验证总结:');
    console.log('==========================================');
    
    const allChecks = [
      { name: '数据迁移完整性', passed: results.basicStats.isComplete },
      { name: '分类数据一致性', passed: results.consistency.consistencyIssues === 0 },
      { name: '孤儿记录检查', passed: results.orphaned.orphanedCount === 0 },
    ];
    
    let passedChecks = 0;
    allChecks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.passed ? '通过' : '失败'}`);
      if (check.passed) passedChecks++;
    });
    
    console.log('==========================================');
    console.log(`🎯 总体评估: ${passedChecks}/${allChecks.length} 项检查通过`);
    
    if (passedChecks === allChecks.length) {
      console.log('🎉 数据迁移验证完全成功！');
      console.log('💡 向后兼容性支持已就绪，新旧系统可以并行运行。');
    } else {
      console.log('⚠️  数据迁移存在问题，需要进一步调查。');
    }
    
    db.close();
    process.exit(passedChecks === allChecks.length ? 0 : 1);
    
  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error);
    db.close();
    process.exit(1);
  }
}

// 执行验证
runValidation();
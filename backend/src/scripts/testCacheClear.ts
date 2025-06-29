import dotenv from 'dotenv';
import { getSequelizeInstance, clearDatabaseCache, forceCreateConnection } from '../config/database';
import { QueryTypes } from 'sequelize';

dotenv.config();

const testCacheClear = async () => {
  console.log('🧪 测试数据库缓存清理功能...\n');

  try {
    // 1. 第一次获取连接
    console.log('1️⃣ 第一次获取数据库连接...');
    const sequelize1 = getSequelizeInstance();
    await sequelize1.authenticate();
    console.log('✅ 第一次连接成功');

    // 检查连接的数据库类型
    const dialect1 = sequelize1.getDialect();
    console.log(`📊 第一次连接类型: ${dialect1.toUpperCase()}`);

    if (dialect1 === 'postgres') {
      const result1 = await sequelize1.query('SELECT current_database() as db', { type: QueryTypes.SELECT });
      console.log(`📍 第一次连接数据库: ${(result1[0] as any).db}\n`);
    }

    // 2. 清理缓存
    console.log('2️⃣ 清理数据库连接缓存...');
    await clearDatabaseCache();
    console.log('✅ 缓存清理完成\n');

    // 3. 强制创建新连接
    console.log('3️⃣ 强制创建新的数据库连接...');
    const sequelize2 = forceCreateConnection();
    await sequelize2.authenticate();
    console.log('✅ 新连接创建成功');

    // 检查新连接的数据库类型
    const dialect2 = sequelize2.getDialect();
    console.log(`📊 新连接类型: ${dialect2.toUpperCase()}`);

    if (dialect2 === 'postgres') {
      const result2 = await sequelize2.query('SELECT current_database() as db', { type: QueryTypes.SELECT });
      console.log(`📍 新连接数据库: ${(result2[0] as any).db}\n`);
    }

    // 4. 验证连接是否不同
    console.log('4️⃣ 验证连接实例...');
    if (sequelize1 !== sequelize2) {
      console.log('✅ 确认：新连接是不同的实例');
    } else {
      console.log('⚠️  警告：连接实例相同，缓存可能未清理');
    }

    // 5. 测试数据库查询
    console.log('\n5️⃣ 测试新连接的数据库查询...');
    const userCount = await sequelize2.query('SELECT COUNT(*) as count FROM users', { type: QueryTypes.SELECT });
    console.log(`👥 用户总数: ${(userCount[0] as any).count}`);

    // 6. 最终清理
    console.log('\n6️⃣ 最终清理连接...');
    await clearDatabaseCache();
    console.log('✅ 测试完成，缓存已清理');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
};

// 模拟服务器重启流程
const simulateServerRestart = async () => {
  console.log('\n🔄 模拟服务器重启流程...');
  console.log('=====================================');

  try {
    // 模拟服务器关闭
    console.log('1️⃣ 模拟服务器关闭...');
    await clearDatabaseCache();
    console.log('✅ 服务器关闭，缓存已清理');

    // 模拟环境变量变更
    console.log('\n2️⃣ 模拟环境变量变更...');
    const originalType = process.env.DATABASE_TYPE;
    console.log(`原始 DATABASE_TYPE: ${originalType}`);

    // 模拟服务器重启
    console.log('\n3️⃣ 模拟服务器重启...');
    const newConnection = forceCreateConnection();
    await newConnection.authenticate();
    console.log('✅ 服务器重启成功，使用新的数据库连接');

    const dialect = newConnection.getDialect();
    console.log(`📊 重启后连接类型: ${dialect.toUpperCase()}`);

    if (dialect === 'postgres') {
      const result = await newConnection.query('SELECT current_database() as db, current_user as user', { type: QueryTypes.SELECT });
      const info = result[0] as any;
      console.log(`📍 重启后连接: ${info.db} (用户: ${info.user})`);
    }

    console.log('\n✅ 服务器重启流程测试完成');
    await clearDatabaseCache();

  } catch (error) {
    console.error('❌ 服务器重启流程测试失败:', error);
  }
};

// 运行测试
const runTests = async () => {
  await testCacheClear();
  await simulateServerRestart();
  console.log('\n🎉 所有测试完成！');
};

runTests();
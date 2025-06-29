import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User } from '../models/User';

const debugLogin = async () => {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const email = 'carol.liu@example.com';
    const password = 'password123';

    console.log('🔍 查找用户:', email);

    // 查找用户
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      console.log('❌ 用户不存在');
      return;
    }

    console.log('✅ 找到用户:', {
      id: user.id,
      username: user.username,
      email: user.email,
    });

    console.log('🔐 验证密码...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isPasswordValid);

    if (isPasswordValid) {
      console.log('🎉 登录应该成功');
    } else {
      console.log('❌ 密码不匹配');
      console.log('存储的密码哈希:', user.password);
      
      // 尝试创建新的哈希来对比
      const newHash = await bcrypt.hash(password, 10);
      console.log('新生成的哈希:', newHash);
      
      const testNewHash = await bcrypt.compare(password, newHash);
      console.log('新哈希验证:', testNewHash);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error);
  } finally {
    await sequelize.close();
  }
};

debugLogin();
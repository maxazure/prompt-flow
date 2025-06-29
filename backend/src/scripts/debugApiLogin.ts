import bcrypt from 'bcryptjs';
import { sequelize } from '../config/database';
import { User } from '../models/User';

const debugApiLogin = async () => {
  try {
    // 确保数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    const email = 'carol.liu@example.com';
    const password = 'password123';

    console.log('🔍 模拟API登录流程...');

    // 模拟authService中的loginUser函数
    // 1. 查找用户
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('❌ 用户不存在 - 抛出"Invalid credentials"');
      return;
    }

    console.log('✅ 找到用户:', {
      id: user.id,
      username: user.username,
      email: user.email,
    });

    console.log('🔐 验证密码...');
    console.log('输入的密码:', password);
    console.log('存储的哈希:', user.password);
    
    // 2. 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('密码验证结果:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ 密码验证失败 - 抛出"Invalid credentials"');
      return;
    }

    console.log('🎉 登录验证成功');

    // 3. 检查是否能正常生成token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'development_secret',
      { expiresIn: '7d' }
    );
    
    console.log('🔑 Token生成成功:', token.substring(0, 50) + '...');

    // 4. 检查返回的用户数据
    const { password: _, ...userWithoutPassword } = user.toJSON();
    console.log('👤 返回的用户数据:', userWithoutPassword);

  } catch (error) {
    console.error('❌ 调试失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  } finally {
    await sequelize.close();
  }
};

debugApiLogin();
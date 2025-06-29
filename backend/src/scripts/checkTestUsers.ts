import dotenv from 'dotenv';
import { sequelize } from '../config/database';
import { User } from '../models/User';

dotenv.config();

const checkTestUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const testEmails = [
      'alice.chen@example.com',
      'bob.wang@example.com', 
      'carol.liu@example.com'
    ];

    console.log('🔍 Checking for test users...');
    
    for (const email of testEmails) {
      const user = await User.findOne({ where: { email } });
      if (user) {
        console.log(`✅ Found user: ${user.username} (${user.email})`);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

checkTestUsers();
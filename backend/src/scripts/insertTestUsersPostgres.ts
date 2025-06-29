import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

dotenv.config();

interface TestUser {
  username: string;
  email: string;
  password: string;
}

const TEST_USERS: TestUser[] = [
  {
    username: 'alice_chen',
    email: 'alice.chen@example.com',
    password: 'password123',
  },
  {
    username: 'bob_wang',
    email: 'bob.wang@example.com',
    password: 'password123',
  },
  {
    username: 'carol_liu',
    email: 'carol.liu@example.com',
    password: 'password123',
  },
];

const createTestUsers = async () => {
  console.log('🚀 Creating test users in PostgreSQL...');
  
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'prompt_flow',
    logging: false,
    pool: {
      max: 1,
      min: 0,
      acquire: 5000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    for (const userData of TEST_USERS) {
      try {
        // Check if user exists
        const existingUser = await sequelize.query(
          'SELECT id, username, email FROM users WHERE email = $1',
          {
            bind: [userData.email],
            type: QueryTypes.SELECT,
          }
        );

        if (existingUser.length > 0) {
          console.log(`⚠️  User ${userData.username} already exists, skipping`);
          continue;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const now = new Date();

        // Create user
        await sequelize.query(
          'INSERT INTO users (username, email, password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)',
          {
            bind: [userData.username, userData.email, hashedPassword, now, now],
            type: QueryTypes.INSERT,
          }
        );

        console.log(`✅ Created user: ${userData.username} (${userData.email})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.username}:`, error);
      }
    }

    // Verify users were created
    console.log('\n🔍 Verifying created users...');
    const users = await sequelize.query(
      'SELECT id, username, email FROM users WHERE email = ANY($1)',
      {
        bind: [TEST_USERS.map(u => u.email)],
        type: QueryTypes.SELECT,
      }
    );

    console.log('📋 Test users in database:');
    users.forEach((user: any) => {
      console.log(`   👤 ${user.username} (${user.email}) - ID: ${user.id}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
};

createTestUsers();
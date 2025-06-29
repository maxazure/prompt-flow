import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  console.log('🔧 Testing PostgreSQL connection...');
  console.log('📍 Host:', process.env.POSTGRES_HOST);
  console.log('📍 Port:', process.env.POSTGRES_PORT);
  console.log('📍 User:', process.env.POSTGRES_USER);
  console.log('📍 Database:', process.env.POSTGRES_DB);
  console.log('📍 Password length:', process.env.POSTGRES_PASSWORD?.length);

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_DB || 'prompt_flow',
    logging: console.log,
    pool: {
      max: 1,
      min: 0,
      acquire: 5000,
      idle: 10000
    }
  });

  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');

    // Test a simple query
    const result = await sequelize.query('SELECT version();');
    console.log('📊 PostgreSQL version:', result[0][0]);

    // List tables
    const tables = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log('📋 Available tables:', tables[0]);

  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  } finally {
    await sequelize.close();
  }
};

testConnection();
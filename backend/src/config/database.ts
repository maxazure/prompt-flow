import { Sequelize } from 'sequelize';
import path from 'path';

const isTest = process.env.NODE_ENV === 'test';
const dbPath = isTest
  ? ':memory:'
  : path.join(__dirname, '../../database.sqlite');

export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

export const initDatabase = async () => {
  try {
    // 确保所有模型都被加载
    require('../models');
    
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    await sequelize.sync({ force: isTest });
    console.log('Database synchronized.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};
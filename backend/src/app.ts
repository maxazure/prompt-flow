import dotenv from 'dotenv';
// 确保环境变量在所有其他导入之前加载
dotenv.config();

import express from 'express';
import cors from 'cors';
import { initDatabase } from './config/database';
import routes from './routes';

const app = express();

app.use(cors());
app.use(express.json());

// 详细的请求日志中间件
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const authorization = req.get('Authorization') ? 'Bearer ***' : 'None';
  
  console.log(`\n🔍 [${timestamp}] ${method} ${url}`);
  console.log(`   📍 IP: ${ip}`);
  console.log(`   🔐 Auth: ${authorization}`);
  console.log(`   🖥️  User-Agent: ${userAgent}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   📦 Body:`, JSON.stringify(req.body, null, 2));
  }
  
  if (Object.keys(req.query).length > 0) {
    console.log(`   🔍 Query:`, req.query);
  }

  // 记录响应时间
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusColor = res.statusCode >= 400 ? '🔴' : res.statusCode >= 300 ? '🟡' : '🟢';
    console.log(`   ${statusColor} Response: ${res.statusCode} (${duration}ms)\n`);
  });
  
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PromptFlow API is running' });
});

app.use('/api', routes);

export { app };
# 测试数据脚本使用指南

## 📋 概述

`insertTestData.ts` 脚本用于向 PromptFlow 数据库中插入测试数据，包括用户、分类和提示词，便于开发和测试。

## 🎯 脚本功能

### 插入的数据类型：
- **3个测试用户**：alice_chen, bob_wang, carol_liu
- **8个测试分类**：编程开发、营销文案、数据分析等
- **40个测试提示词**：涵盖各种实用场景

### 数据特点：
- ✅ 真实场景的提示词模板
- ✅ 参数化内容支持
- ✅ 合理的分类分布
- ✅ 公开/私有状态混合
- ✅ 多样化的标签系统

## 🚀 使用方法

### 1. 直接运行脚本
```bash
# 进入后端目录
cd backend

# 运行测试数据插入脚本
npm run seed:test-data
```

### 2. 使用ts-node直接执行
```bash
cd backend
npx ts-node src/scripts/insertTestData.ts
```

## 📊 插入的测试数据详情

### 👥 测试用户
| 用户名 | 邮箱 | 密码 |
|--------|------|------|
| alice_chen | alice.chen@example.com | password123 |
| bob_wang | bob.wang@example.com | password123 |
| carol_liu | carol.liu@example.com | password123 |

### 📁 测试分类
- 🔵 编程开发 - 编程、开发相关的提示词
- 🔴 营销文案 - 营销、文案创作类提示词  
- 🟢 数据分析 - 数据分析、报告生成类
- 🟣 产品设计 - 产品设计、用户体验类
- 🟡 项目管理 - 项目管理、团队协作类
- 🔵 学习教育 - 教育、培训、学习类
- 🟣 创意写作 - 创意写作、内容创作类
- 🟢 商业分析 - 商业策略、分析类

### 📝 提示词示例
- **营销文案生成器** - 参数化营销文案创作
- **代码审查助手** - 专业代码质量分析
- **API文档生成器** - 自动生成API文档
- **学习计划制定师** - 个性化学习计划
- **邮件回复助手** - 智能邮件回复生成
- **产品需求分析师** - 产品需求分析工具
- **创意头脑风暴器** - 创意思维激发
- **数据分析报告生成器** - 专业数据分析报告
- **React组件生成器** - 快速生成React组件
- **用户体验优化建议器** - UX优化专业建议
- **SQL查询优化器** - SQL性能优化建议
- **技术架构评估师** - 专业技术架构评估
- **面试问题生成器** - 生成专业面试问题
- **社交媒体文案创作器** - 社交媒体内容创作
- **用户故事编写器** - 规范用户故事编写
- **SEO优化建议师** - 网站SEO优化建议
- **会议纪要整理器** - 自动整理会议记录
- **竞品分析报告生成器** - 专业竞品分析
- **内容大纲生成器** - 结构化内容创作
- **项目风险评估器** - 项目风险识别管理
- ...等共60+个高质量提示词

## ⚠️ 注意事项

### 数据安全
- 🔒 所有用户密码都使用 bcrypt 加密
- 🔍 脚本会检查重复数据，避免重复插入
- 🛡️ 只插入测试数据，不会影响现有生产数据

### 运行要求
- ✅ 确保数据库服务正在运行
- ✅ 确保 `.env` 文件配置正确
- ✅ 确保数据库表已经创建（运行过迁移）

### 重复运行
- 脚本可以安全地重复运行
- 已存在的数据会被跳过，不会重复创建
- 输出日志会清楚标明跳过的项目

## 🔧 自定义数据

如果需要修改测试数据，可以编辑脚本中的以下部分：

### 修改用户数据
```typescript
const TEST_USERS: TestUser[] = [
  {
    username: 'your_username',
    email: 'your@email.com',
    password: 'your_password',
  },
  // 添加更多用户...
];
```

### 修改分类数据
```typescript
const TEST_CATEGORIES = [
  { 
    name: '你的分类', 
    description: '分类描述', 
    color: '#颜色代码' 
  },
  // 添加更多分类...
];
```

### 添加提示词模板
```typescript
const PROMPT_TEMPLATES: Omit<TestPrompt, 'isPublic'>[] = [
  {
    title: '你的提示词标题',
    content: '提示词内容，支持 {参数} 占位符',
    description: '提示词描述',
    tags: ['标签1', '标签2'],
  },
  // 添加更多模板...
];
```

## 📈 验证结果

脚本运行完成后，可以通过以下方式验证：

### 1. 登录测试
访问前端应用，使用测试用户账号登录：
- 邮箱：alice.chen@example.com
- 密码：password123

### 2. 数据库查询
```sql
-- 查看用户数
SELECT COUNT(*) FROM users;

-- 查看分类数
SELECT COUNT(*) FROM categories;

-- 查看提示词数
SELECT COUNT(*) FROM prompts;

-- 查看公开提示词
SELECT title, username, name as category_name 
FROM prompts p
JOIN users u ON p.userId = u.id
JOIN categories c ON p.categoryId = c.id
WHERE p.isPublic = true;
```

### 3. 前端界面检查
- 🏠 首页应该显示公开的提示词卡片
- 📁 左侧应该显示创建的分类
- 🔍 搜索功能应该能找到相关提示词
- 👤 用户资料页应该显示对应的提示词

## 🐛 故障排除

### 常见错误及解决方案

**数据库连接失败**
```
❌ 插入测试数据失败: ConnectionError
```
解决：检查数据库服务是否启动，`.env` 配置是否正确

**表不存在错误**
```
❌ no such table: users
```
解决：运行数据库迁移 `npm run migrate`

**权限错误**
```
❌ permission denied
```
解决：检查数据库文件权限，确保Node.js进程有读写权限

**重复数据警告**
```
⚠️ 用户 alice_chen 已存在，跳过
```
这是正常行为，脚本会自动跳过已存在的数据

## 🔄 清理测试数据

如需清理测试数据，可以运行：

```sql
-- 删除测试提示词（谨慎操作）
DELETE FROM prompts WHERE userId IN (
  SELECT id FROM users WHERE email LIKE '%@example.com'
);

-- 删除测试分类（谨慎操作）
DELETE FROM categories WHERE createdBy IN (
  SELECT id FROM users WHERE email LIKE '%@example.com'
);

-- 删除测试用户（谨慎操作）
DELETE FROM users WHERE email LIKE '%@example.com';
```

⚠️ **警告：清理操作不可逆，请谨慎执行！**

## 📞 技术支持

如果遇到问题，请检查：
1. 📋 控制台输出的错误信息
2. 🔍 数据库日志
3. ⚙️ 环境变量配置
4. 🔗 网络连接状态

---

**最后更新：** 2025-06-28  
**版本：** 1.0.0  
**维护者：** PromptFlow Team
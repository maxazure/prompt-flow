# 公共分类移除架构变更 - 详细测试需求文档

## 📋 变更概述

本次架构变更移除了公共分类系统，简化为仅支持个人分类和团队分类。主要变更包括：

1. **数据模型变更**：移除 `CategoryScopeType.PUBLIC` 枚举
2. **数据迁移**：将97个提示词从17个公共分类迁移到各用户的未分类分类
3. **前端重构**：移除公共分类相关UI和逻辑
4. **后端简化**：移除公共分类API和服务逻辑

## 🎯 测试目标

确保架构变更后系统功能完整性，数据一致性，以及用户体验的连续性。

---

## 📊 测试分类与优先级

### 🔴 P0 - 关键功能测试（必须通过）

#### 1. 数据迁移验证测试
**文件位置**: `backend/src/__tests__/migration/publicCategoriesRemoval.test.ts`

```typescript
describe('公共分类移除迁移验证', () => {
  it('应该确保所有公共分类已被删除', async () => {
    // 验证数据库中不存在 scopeType='public' 的分类
  });

  it('应该确保所有原公共分类的提示词已重新分配', async () => {
    // 验证没有提示词的categoryId指向已删除的公共分类
  });

  it('应该确保未分类分类正确创建', async () => {
    // 验证每个用户都有自己的未分类分类
  });

  it('应该确保提示词计数正确更新', async () => {
    // 验证迁移后各用户的未分类分类计数正确
  });
});
```

#### 2. CategoryScopeType 枚举验证测试
**文件位置**: `backend/src/__tests__/models/categoryScopeType.test.ts`

```typescript
describe('CategoryScopeType 枚举验证', () => {
  it('应该只包含 PERSONAL 和 TEAM 两个值', () => {
    expect(Object.values(CategoryScopeType)).toEqual(['personal', 'team']);
  });

  it('不应该包含 PUBLIC 枚举值', () => {
    expect(CategoryScopeType).not.toHaveProperty('PUBLIC');
  });
});
```

#### 3. API 端点核心功能测试
**文件位置**: `backend/src/__tests__/api/categories.simplified.test.ts`

```typescript
describe('分类API - 简化版本', () => {
  describe('GET /api/categories', () => {
    it('已登录用户应该只返回 personal 和 team 分组', async () => {
      const response = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.body.categories).toHaveProperty('personal');
      expect(response.body.categories).toHaveProperty('team');
      expect(response.body.categories).not.toHaveProperty('public');
    });

    it('未登录用户应该返回空的分类结构', async () => {
      const response = await request(app).get('/api/categories');
      
      expect(response.body.categories.personal).toEqual([]);
      expect(response.body.categories.team).toEqual([]);
      expect(response.body.total).toBe(0);
    });
  });

  describe('POST /api/categories', () => {
    it('应该拒绝创建公共分类的尝试', async () => {
      const categoryData = {
        name: '测试公共分类',
        scopeType: 'public'  // 尝试使用字符串方式
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid scopeType');
    });

    it('应该成功创建个人分类', async () => {
      const categoryData = {
        name: '个人测试分类',
        scopeType: 'personal'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.category.scopeType).toBe('personal');
    });

    it('应该成功创建团队分类', async () => {
      const categoryData = {
        name: '团队测试分类',
        scopeType: 'team'
      };

      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send(categoryData);

      expect(response.status).toBe(201);
      expect(response.body.category.scopeType).toBe('team');
    });
  });
});
```

### 🟡 P1 - 重要功能测试

#### 4. 前端组件测试
**文件位置**: `frontend/src/__tests__/components/CategorySidebar.simplified.test.tsx`

```typescript
describe('CategorySidebar - 简化版本', () => {
  it('应该只显示个人分类和团队分类分组', () => {
    render(<CategorySidebar {...defaultProps} />);
    
    expect(screen.getByText('个人分类')).toBeInTheDocument();
    expect(screen.getByText('团队分类')).toBeInTheDocument();
    expect(screen.queryByText('公开分类')).not.toBeInTheDocument();
  });

  it('应该正确初始化展开状态（只包含 personal 和 team）', () => {
    const { result } = renderHook(() => useState(new Set(['personal', 'team'])));
    const [expandedGroups] = result.current;
    
    expect(expandedGroups.has('personal')).toBe(true);
    expect(expandedGroups.has('team')).toBe(true);
    expect(expandedGroups.has('public')).toBe(false);
  });
});
```

**文件位置**: `frontend/src/__tests__/components/CreateCategoryButton.simplified.test.tsx`

```typescript
describe('CreateCategoryButton - 简化版本', () => {
  it('作用域选择器应该只包含个人分类和团队分类选项', () => {
    render(<CreateCategoryButton />);
    
    const selectElement = screen.getByRole('combobox');
    const options = within(selectElement).getAllByRole('option');
    
    expect(options).toHaveLength(2);
    expect(options[0]).toHaveValue('personal');
    expect(options[1]).toHaveValue('team');
  });

  it('默认选择应该是个人分类', () => {
    render(<CreateCategoryButton />);
    
    const selectElement = screen.getByRole('combobox');
    expect(selectElement).toHaveValue('personal');
  });
});
```

#### 5. 分类服务测试
**文件位置**: `backend/src/__tests__/services/categoryService.simplified.test.ts`

```typescript
describe('CategoryService - 简化版本', () => {
  describe('getUserVisibleCategories', () => {
    it('应该只返回用户的个人分类和团队分类', async () => {
      const categories = await categoryService.getUserVisibleCategories(userId);
      
      const hasPublicCategory = categories.some(cat => cat.scopeType === 'public');
      expect(hasPublicCategory).toBe(false);
      
      const validScopeTypes = categories.every(cat => 
        cat.scopeType === 'personal' || cat.scopeType === 'team'
      );
      expect(validScopeTypes).toBe(true);
    });
  });

  describe('getPublicCategories', () => {
    it('应该返回空数组（功能已移除）', async () => {
      const publicCategories = await categoryService.getPublicCategories();
      expect(publicCategories).toEqual([]);
    });
  });

  describe('createCategory', () => {
    it('应该拒绝创建公共分类', async () => {
      const categoryData = {
        name: '测试公共分类',
        scopeType: 'public' as any,  // 强制类型转换来测试
        createdBy: userId
      };

      await expect(categoryService.createCategory(categoryData))
        .rejects.toThrow('Invalid scopeType');
    });
  });
});
```

### 🟢 P2 - 边界情况和兼容性测试

#### 6. 数据一致性测试
**文件位置**: `backend/src/__tests__/integration/dataConsistency.test.ts`

```typescript
describe('数据一致性验证', () => {
  it('应该确保没有孤儿提示词（categoryId指向不存在的分类）', async () => {
    const orphanPrompts = await Prompt.findAll({
      include: [{
        model: Category,
        as: 'categoryRelation',
        required: false
      }]
    });

    const orphans = orphanPrompts.filter(prompt => 
      prompt.categoryId && !prompt.categoryRelation
    );

    expect(orphans).toHaveLength(0);
  });

  it('应该确保所有用户都有未分类分类', async () => {
    const users = await User.findAll();
    
    for (const user of users) {
      const uncategorized = await Category.findOne({
        where: {
          name: '未分类',
          scopeType: 'personal',
          scopeId: user.id
        }
      });
      
      expect(uncategorized).toBeTruthy();
    }
  });
});
```

#### 7. 向后兼容性测试
**文件位置**: `backend/src/__tests__/compatibility/backwardCompatibility.test.ts`

```typescript
describe('向后兼容性验证', () => {
  it('应该正确处理包含旧公共分类引用的前端请求', async () => {
    // 模拟前端发送包含 public 分组的请求
    const mockOldRequest = {
      categories: {
        personal: [],
        team: [],
        public: []  // 旧格式
      }
    };

    // 验证后端能够优雅处理，不会崩溃
  });

  it('应该正确迁移旧的分类数据引用', async () => {
    // 验证迁移后数据的完整性
  });
});
```

---

## 🚨 需要修复的现有测试

### 编译错误修复清单

1. **categories.api.test.ts** - 移除所有 `CategoryScopeType.PUBLIC` 引用
2. **categoryService.test.ts** - 更新服务测试，移除公共分类逻辑
3. **category.test.ts** - 更新模型测试
4. **其他测试文件** - 批量替换 `CategoryScopeType.PUBLIC` 引用

### 前端测试更新清单

1. **CategorySidebar.test.tsx** - 移除公共分类组测试
2. **CategoryContext.test.tsx** - 更新context测试
3. **CreateCategoryButton.test.tsx** - 移除PUBLIC选项测试
4. **各页面组件测试** - 确保不依赖公共分类数据

---

## 🔄 测试执行策略

### 阶段1：修复编译错误
```bash
# 后端编译检查
cd backend && pnpm run type-check

# 前端编译检查  
cd frontend && pnpm run type-check
```

### 阶段2：核心功能验证
```bash
# 运行P0级别测试
pnpm test -- --testNamePattern="(迁移验证|CategoryScopeType|分类API)"

# 验证数据迁移结果
npx tsx src/scripts/verifyMigration.ts
```

### 阶段3：集成测试
```bash
# 运行完整测试套件
pnpm test

# 前端测试
cd frontend && pnpm test
```

### 阶段4：手动验证
1. 启动开发服务器
2. 验证未登录用户首页体验
3. 验证已登录用户分类管理功能
4. 验证提示词创建和分类分配

---

## 📝 测试数据准备

### 测试数据脚本
**文件位置**: `backend/src/scripts/setupTestDataForMigrationTest.ts`

```typescript
/**
 * 为迁移测试准备测试数据
 */
export async function setupTestData() {
  // 创建测试用户
  const users = await createTestUsers();
  
  // 创建各种类型的分类（确保迁移前后对比）
  const categories = await createTestCategories(users);
  
  // 创建测试提示词
  const prompts = await createTestPrompts(users, categories);
  
  return { users, categories, prompts };
}
```

---

## 🎯 成功标准

### 功能性标准
- [ ] 所有P0测试通过率 100%
- [ ] 所有P1测试通过率 ≥ 95%
- [ ] 无编译错误
- [ ] 无运行时错误

### 性能标准
- [ ] API响应时间 < 200ms
- [ ] 页面加载时间无明显变化
- [ ] 数据库查询效率不降低

### 数据完整性标准
- [ ] 零数据丢失
- [ ] 所有提示词正确重分配
- [ ] 用户权限保持不变
- [ ] 分类计数准确

---

## 🔧 调试和故障排除

### 常见问题检查清单
1. **编译错误**：搜索所有 `CategoryScopeType.PUBLIC` 引用
2. **运行时错误**：检查是否有硬编码的 'public' 字符串
3. **数据不一致**：运行数据验证脚本
4. **测试失败**：检查测试数据准备和清理

### 调试工具
```bash
# 搜索所有公共分类引用
grep -r "CategoryScopeType.PUBLIC\|'public'\|\"public\"" src/

# 验证数据库状态
npx tsx src/scripts/debugDatabaseState.ts

# 检查迁移结果
npx tsx src/scripts/verifyMigrationResults.ts
```

---

## 📚 参考文档

- [架构变更设计文档](./public-categories-removal-design.md)
- [数据迁移文档](./data-migration-guide.md)
- [API变更说明](./api-changes-documentation.md)

---

**注意**：本测试计划应该在下一个对话中逐步实施，优先处理P0级别的测试，确保核心功能的稳定性。
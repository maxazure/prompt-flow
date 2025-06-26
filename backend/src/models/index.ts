export { User } from './User';
export { Prompt } from './Prompt';
export { PromptVersion } from './PromptVersion';
export { Team } from './Team';
export { TeamMember, TeamRole } from './TeamMember';
export { Comment } from './Comment';
export { Category, CategoryScopeType } from './Category';

// 设置模型关联关系
import { User } from './User';
import { Prompt } from './Prompt';
import { PromptVersion } from './PromptVersion';
import { Team } from './Team';
import { TeamMember } from './TeamMember';
import { Comment } from './Comment';
import { Category } from './Category';

// User 关联
User.hasMany(Prompt, { foreignKey: 'userId', as: 'prompts' });
User.hasMany(PromptVersion, { foreignKey: 'userId', as: 'promptVersions' });
User.hasMany(Team, { foreignKey: 'ownerId', as: 'ownedTeams' });
User.hasMany(TeamMember, { foreignKey: 'userId', as: 'teamMemberships' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });

// Prompt 关联
Prompt.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Prompt.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
Prompt.belongsTo(Category, { foreignKey: 'categoryId', as: 'categoryRelation' });
Prompt.hasMany(PromptVersion, { foreignKey: 'promptId', as: 'versions' });
Prompt.hasMany(Comment, { foreignKey: 'promptId', as: 'comments' });
Prompt.hasMany(Prompt, { foreignKey: 'parentId', as: 'children' });
Prompt.belongsTo(Prompt, { foreignKey: 'parentId', as: 'parent' });

// PromptVersion 关联
PromptVersion.belongsTo(Prompt, { foreignKey: 'promptId', as: 'prompt' });
PromptVersion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Team 关联
Team.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
Team.hasMany(TeamMember, { foreignKey: 'teamId', as: 'members' });
Team.hasMany(Prompt, { foreignKey: 'teamId', as: 'prompts' });

// TeamMember 关联
TeamMember.belongsTo(Team, { foreignKey: 'teamId', as: 'team' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Comment 关联
Comment.belongsTo(Prompt, { foreignKey: 'promptId', as: 'prompt' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies' });

// Category 关联
Category.hasMany(Prompt, { foreignKey: 'categoryId', as: 'prompts' });
Category.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
// Category.belongsTo(Team, { foreignKey: 'scopeId', as: 'team' });
// Category.belongsTo(User, { foreignKey: 'scopeId', as: 'user' });

// User 和 Category 关联
User.hasMany(Category, { foreignKey: 'createdBy', as: 'createdCategories' });
// User.hasMany(Category, { foreignKey: 'scopeId', as: 'personalCategories' });

// Team 和 Category 关联  
// Team.hasMany(Category, { foreignKey: 'scopeId', as: 'teamCategories' });
import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface PromptAttributes {
  id: number;
  title: string;
  content: string;
  description?: string;
  version: number;
  category?: string; // 保留用于向后兼容
  categoryId?: number; // 新的分类关联字段
  projectId?: number; // 项目关联字段
  promptNumber?: string; // 项目内编号（如：P1-001）
  isProjectPrompt?: boolean; // 是否为项目提示词
  showInCategory?: boolean; // 是否在分类中显示
  tags?: string[];
  userId: number;
  parentId?: number;
  isPublic: boolean;
  teamId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromptCreationAttributes extends Optional<PromptAttributes, 'id' | 'version' | 'isPublic'> {}

export class Prompt extends Model<PromptAttributes, PromptCreationAttributes> implements PromptAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public description?: string;
  public version!: number;
  public category?: string; // 保留用于向后兼容
  public categoryId?: number; // 新的分类关联字段
  public projectId?: number; // 项目关联字段
  public promptNumber?: string; // 项目内编号（如：P1-001）
  public isProjectPrompt?: boolean; // 是否为项目提示词
  public showInCategory?: boolean; // 是否在分类中显示
  public tags?: string[];
  public userId!: number;
  public parentId?: number;
  public isPublic!: boolean;
  public teamId?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Prompt.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    promptNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '项目内编号，格式如：P1-001',
    },
    isProjectPrompt: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: '是否为项目提示词',
    },
    showInCategory: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: '是否在分类中显示',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id',
      },
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'prompts',
        key: 'id',
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'prompts',
  }
);

// Note: Model associations are now defined in models/index.ts
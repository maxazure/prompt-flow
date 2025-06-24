import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

interface PromptAttributes {
  id: number;
  title: string;
  content: string;
  description?: string;
  version: number;
  isTemplate: boolean;
  category?: string;
  tags?: string[];
  userId: number;
  parentId?: number;
  isPublic: boolean;
  teamId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromptCreationAttributes extends Optional<PromptAttributes, 'id' | 'version' | 'isTemplate' | 'isPublic'> {}

export class Prompt extends Model<PromptAttributes, PromptCreationAttributes> implements PromptAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public description?: string;
  public version!: number;
  public isTemplate!: boolean;
  public category?: string;
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
    isTemplate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
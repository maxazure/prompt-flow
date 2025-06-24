import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { Prompt } from './Prompt';

interface PromptVersionAttributes {
  id: number;
  promptId: number;
  version: number;
  title: string;
  content: string;
  description?: string;
  category?: string;
  tags?: string[];
  userId: number;
  changeLog?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PromptVersionCreationAttributes extends Optional<PromptVersionAttributes, 'id'> {}

export class PromptVersion extends Model<PromptVersionAttributes, PromptVersionCreationAttributes> implements PromptVersionAttributes {
  public id!: number;
  public promptId!: number;
  public version!: number;
  public title!: string;
  public content!: string;
  public description?: string;
  public category?: string;
  public tags?: string[];
  public userId!: number;
  public changeLog?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromptVersion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    promptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'prompts',
        key: 'id',
      },
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    changeLog: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'prompt_versions',
    indexes: [
      {
        unique: true,
        fields: ['promptId', 'version'],
      },
    ],
  }
);

// Note: Model associations are now defined in models/index.ts
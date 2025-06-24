import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface CommentAttributes {
  id: number;
  promptId: number;
  userId: number;
  content: string;
  parentId?: number;
  isResolved: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id' | 'parentId' | 'isResolved'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public promptId!: number;
  public userId!: number;
  public content!: string;
  public parentId!: number;
  public isResolved!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Comment.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'comments',
        key: 'id',
      },
    },
    isResolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    tableName: 'comments',
  }
);
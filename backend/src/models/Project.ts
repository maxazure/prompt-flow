import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ProjectAttributes {
  id: number;
  name: string;
  description?: string;
  background: string; // 项目背景，用作系统级提示词
  userId: number; // 项目创建者
  teamId?: number; // 可选的团队归属
  isPublic: boolean; // 是否公开
  isActive: boolean; // 是否激活（软删除标识）
  createdAt?: Date;
  updatedAt?: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'isPublic' | 'isActive'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public background!: string;
  public userId!: number;
  public teamId?: number;
  public isPublic!: boolean;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '项目名称不能为空',
        },
        len: {
          args: [1, 200],
          msg: '项目名称长度必须在1-200字符之间',
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    background: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: '项目背景不能为空',
        },
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      validate: {
        notNull: {
          msg: '用户ID不能为空',
        },
      },
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'teams',
        key: 'id',
      },
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    indexes: [
      // 用户项目索引
      {
        fields: ['userId', 'isActive'],
      },
      // 团队项目索引
      {
        fields: ['teamId', 'isActive'],
      },
      // 公开项目索引
      {
        fields: ['isPublic', 'isActive'],
      },
      // 项目名称搜索索引
      {
        fields: ['name'],
      },
    ],
  }
);

export default Project;
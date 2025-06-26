import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum CategoryScopeType {
  PERSONAL = 'personal',
  TEAM = 'team',
  PUBLIC = 'public'
}

interface CategoryAttributes {
  id: number;
  name: string;
  description?: string;
  scopeType: CategoryScopeType;
  scopeId?: number; // userId for personal, teamId for team, null for public
  createdBy: number; // userId of creator
  color?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CategoryCreationAttributes extends Optional<CategoryAttributes, 'id' | 'isActive'> {}

export class Category extends Model<CategoryAttributes, CategoryCreationAttributes> implements CategoryAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public scopeType!: CategoryScopeType;
  public scopeId?: number;
  public createdBy!: number;
  public color?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scopeType: {
      type: DataTypes.ENUM(...Object.values(CategoryScopeType)),
      allowNull: false,
    },
    scopeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING(7), // hex color code like #FF5733
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i, // validates hex color format
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'categories',
    indexes: [
      // Basic index for common queries
      {
        fields: ['scopeType', 'scopeId', 'isActive'],
      },
      {
        fields: ['createdBy'],
      },
      {
        fields: ['name'],
      },
    ],
  }
);
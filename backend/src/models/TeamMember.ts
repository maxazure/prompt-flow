import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

interface TeamMemberAttributes {
  id: number;
  teamId: number;
  userId: number;
  role: TeamRole;
  joinedAt: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TeamMemberCreationAttributes extends Optional<TeamMemberAttributes, 'id' | 'joinedAt' | 'isActive'> {}

export class TeamMember extends Model<TeamMemberAttributes, TeamMemberCreationAttributes> implements TeamMemberAttributes {
  public id!: number;
  public teamId!: number;
  public userId!: number;
  public role!: TeamRole;
  public joinedAt!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

TeamMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
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
    role: {
      type: DataTypes.ENUM(...Object.values(TeamRole)),
      allowNull: false,
      defaultValue: TeamRole.VIEWER,
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'team_members',
    indexes: [
      {
        unique: true,
        fields: ['teamId', 'userId'],
      },
    ],
  }
);
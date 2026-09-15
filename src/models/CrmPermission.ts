import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmPermissionAttributes {
  id: number;
  permission_key: string;
  module: string;
  action: string;
  label: string;
  description?: string | null;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

interface CrmPermissionCreationAttributes extends Optional<CrmPermissionAttributes, 'id' | 'description' | 'status' | 'created_at' | 'updated_at'> {}

class CrmPermission extends Model<CrmPermissionAttributes, CrmPermissionCreationAttributes> implements CrmPermissionAttributes {
  declare id: number;
  declare permission_key: string;
  declare module: string;
  declare action: string;
  declare label: string;
  declare description: string | null;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmPermission.hasMany(models.CrmRolePermission, { foreignKey: 'permission_id', sourceKey: 'id', as: 'rolePermissions' });
    CrmPermission.belongsToMany(models.CrmRole, {
      through: models.CrmRolePermission,
      foreignKey: 'permission_id',
      otherKey: 'role_id',
      as: 'roles',
    });
  }
}

CrmPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    permission_key: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CrmPermission',
    tableName: 'crm_permissions',
    timestamps: false,
    freezeTableName: true,
  },
);

export { CrmPermission };
export type { CrmPermissionAttributes, CrmPermissionCreationAttributes };

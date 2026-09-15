import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmRolePermissionAttributes {
  id: number;
  role_id: number;
  permission_id: number;
  status: number;
  created_at?: Date;
  updated_at?: Date;
}

interface CrmRolePermissionCreationAttributes extends Optional<CrmRolePermissionAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class CrmRolePermission extends Model<CrmRolePermissionAttributes, CrmRolePermissionCreationAttributes> implements CrmRolePermissionAttributes {
  declare id: number;
  declare role_id: number;
  declare permission_id: number;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmRolePermission.belongsTo(models.CrmRole, { foreignKey: 'role_id', targetKey: 'id', as: 'role' });
    CrmRolePermission.belongsTo(models.CrmPermission, { foreignKey: 'permission_id', targetKey: 'id', as: 'permission' });
  }
}

CrmRolePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'CrmRolePermission',
    tableName: 'crm_role_permissions',
    timestamps: false,
    freezeTableName: true,
  },
);

export { CrmRolePermission };
export type { CrmRolePermissionAttributes, CrmRolePermissionCreationAttributes };

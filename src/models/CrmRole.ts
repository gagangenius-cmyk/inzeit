import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmRoleAttributes {
  id: number;
  name: string;
  hierarchy: number;
  status: number;
  type: string;
  department_id: number;
}

interface CrmRoleCreationAttributes extends Optional<CrmRoleAttributes, 'status'> {}

class CrmRole extends Model<CrmRoleAttributes, CrmRoleCreationAttributes> implements CrmRoleAttributes {
  declare id: number;
  declare name: string;
  declare hierarchy: number;
  declare status: number;
  declare type: string;
  declare department_id: number;

  public static associate(models: any) {
    CrmRole.hasMany(models.CrmEmployee, { foreignKey: 'role', sourceKey: 'id', as: 'dmEmployees' });
    CrmRole.hasMany(models.CrmRolePermission, { foreignKey: 'role_id', sourceKey: 'id', as: 'rolePermissions' });
    CrmRole.belongsToMany(models.CrmPermission, {
      through: models.CrmRolePermission,
      foreignKey: 'role_id',
      otherKey: 'permission_id',
      as: 'permissions',
    });
  }
}

CrmRole.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    hierarchy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    type: {
      type: DataTypes.STRING(55),
      allowNull: false
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmRole',
    tableName: 'crm_role',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmRole };
export type { CrmRoleAttributes, CrmRoleCreationAttributes };

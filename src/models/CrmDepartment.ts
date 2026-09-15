import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmDepartmentAttributes {
  id: number;
  name: string;
  status: number;
}

interface CrmDepartmentCreationAttributes extends Optional<CrmDepartmentAttributes, 'status'> {}

class CrmDepartment extends Model<CrmDepartmentAttributes, CrmDepartmentCreationAttributes> implements CrmDepartmentAttributes {
  declare id: number;
  declare name: string;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmDepartment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
  },
  {
    sequelize,
    modelName: 'CrmDepartment',
    tableName: 'crm_department',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmDepartment };
export type { CrmDepartmentAttributes, CrmDepartmentCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmLeaveTypeAttributes {
  id: number;
  name: string;
  status: number;
}

interface CrmLeaveTypeCreationAttributes extends Optional<CrmLeaveTypeAttributes, 'status'> {}

class CrmLeaveType extends Model<CrmLeaveTypeAttributes, CrmLeaveTypeCreationAttributes> implements CrmLeaveTypeAttributes {
  declare id: number;
  declare name: string;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmLeaveType.init(
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
    modelName: 'CrmLeaveType',
    tableName: 'crm_leave_type',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmLeaveType };
export type { CrmLeaveTypeAttributes, CrmLeaveTypeCreationAttributes };

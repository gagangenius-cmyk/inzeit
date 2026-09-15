import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmOperationAllocationsAttributes {
  id: number;
  case_officer: number;
  branch: number;
  type: string;
  start_date: Date;
  end_date: Date;
  created: Date;
  created_by: number;
  status: number;
  is_deleted: number;
}

interface CrmOperationAllocationsCreationAttributes extends Optional<CrmOperationAllocationsAttributes, never> {}

class CrmOperationAllocations extends Model<CrmOperationAllocationsAttributes, CrmOperationAllocationsCreationAttributes> implements CrmOperationAllocationsAttributes {
  declare id: number;
  declare case_officer: number;
  declare branch: number;
  declare type: string;
  declare start_date: Date;
  declare end_date: Date;
  declare created: Date;
  declare created_by: number;
  declare status: number;
  declare is_deleted: number;

  public static associate(models: any) {
    CrmOperationAllocations.belongsTo(models.CrmEmployee, { foreignKey: 'case_officer', targetKey: 'id', as: 'caseOfficer' });
    CrmOperationAllocations.belongsTo(models.CrmBranch, { foreignKey: 'branch', targetKey: 'id', as: 'branchDetails' });
  }
}

CrmOperationAllocations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    case_officer: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_deleted: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmOperationAllocations',
    tableName: 'crm_operation_allocations',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmOperationAllocations };
export type { CrmOperationAllocationsAttributes, CrmOperationAllocationsCreationAttributes };

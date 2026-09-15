import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmBranchAllocationsAttributes {
  id: number;
  emp_id: number;
  branches: string;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmBranchAllocationsCreationAttributes extends Optional<CrmBranchAllocationsAttributes, never> {}

class CrmBranchAllocations extends Model<CrmBranchAllocationsAttributes, CrmBranchAllocationsCreationAttributes> implements CrmBranchAllocationsAttributes {
  declare id: number;
  declare emp_id: number;
  declare branches: string;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmBranchAllocations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    emp_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branches: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
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
  },
  {
    sequelize,
    modelName: 'CrmBranchAllocations',
    tableName: 'crm_branch_allocations',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmBranchAllocations };
export type { CrmBranchAllocationsAttributes, CrmBranchAllocationsCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmCounsilorAllocationsAttributes {
  id: number;
  branch_id: number;
  counsilors: string;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmCounsilorAllocationsCreationAttributes extends Optional<CrmCounsilorAllocationsAttributes, never> {}

class CrmCounsilorAllocations extends Model<CrmCounsilorAllocationsAttributes, CrmCounsilorAllocationsCreationAttributes> implements CrmCounsilorAllocationsAttributes {
  declare id: number;
  declare branch_id: number;
  declare counsilors: string;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmCounsilorAllocations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    counsilors: {
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
    modelName: 'CrmCounsilorAllocations',
    tableName: 'crm_counsilor_allocations',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCounsilorAllocations };
export type { CrmCounsilorAllocationsAttributes, CrmCounsilorAllocationsCreationAttributes };

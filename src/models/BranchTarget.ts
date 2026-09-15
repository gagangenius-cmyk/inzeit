import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface BranchTargetAttributes {
  id: number;
  branch: number | null;
  month: number | null;
  year: number | null;
  appointment: number | null;
  sales: number | null;
  leads: number | null;
  target_date_id: number | null;
}

interface BranchTargetCreationAttributes extends Optional<BranchTargetAttributes, 'branch' | 'month' | 'year' | 'appointment' | 'sales' | 'leads' | 'target_date_id'> {}

class BranchTarget extends Model<BranchTargetAttributes, BranchTargetCreationAttributes> implements BranchTargetAttributes {
  declare id: number;
  declare branch: number | null;
  declare month: number | null;
  declare year: number | null;
  declare appointment: number | null;
  declare sales: number | null;
  declare leads: number | null;
  declare target_date_id: number | null;

  public static associate(models: any) {
    BranchTarget.belongsTo(models.CrmBranch, { foreignKey: 'branch', targetKey: 'id', as: 'branchDetails' });
  }
}

BranchTarget.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    month: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    appointment: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sales: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    leads: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    target_date_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'BranchTarget',
    tableName: 'branch_target',
    timestamps: false,
    freezeTableName: true,
  });

export { BranchTarget };
export type { BranchTargetAttributes, BranchTargetCreationAttributes };

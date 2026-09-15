import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface TargetAttributes {
  id: number;
  counsilorid: number | null;
  branch: number;
  month: number | null;
  year: number | null;
  appointment: number | null;
  sales: number | null;
  branch_sales: number | null;
  leads: number | null;
  cold: number | null;
  target_date_id: number | null;
}

interface TargetCreationAttributes extends Optional<TargetAttributes, 'counsilorid' | 'month' | 'year' | 'appointment' | 'sales' | 'branch_sales' | 'leads' | 'cold' | 'target_date_id'> {}

class Target extends Model<TargetAttributes, TargetCreationAttributes> implements TargetAttributes {
  declare id: number;
  declare counsilorid: number | null;
  declare branch: number;
  declare month: number | null;
  declare year: number | null;
  declare appointment: number | null;
  declare sales: number | null;
  declare branch_sales: number | null;
  declare leads: number | null;
  declare cold: number | null;
  declare target_date_id: number | null;

  public static associate(models: any) {
  }
}

Target.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    counsilorid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    branch_sales: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    leads: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cold: {
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
    modelName: 'Target',
    tableName: 'target',
    timestamps: false,
    freezeTableName: true,
  });

export { Target };
export type { TargetAttributes, TargetCreationAttributes };

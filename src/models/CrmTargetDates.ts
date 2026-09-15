import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmTargetDatesAttributes {
  id: number;
  month: string;
  start_date: Date;
  end_date: Date;
  status: number;
  created: Date;
}

interface CrmTargetDatesCreationAttributes extends Optional<CrmTargetDatesAttributes, never> {}

class CrmTargetDates extends Model<CrmTargetDatesAttributes, CrmTargetDatesCreationAttributes> implements CrmTargetDatesAttributes {
  declare id: number;
  declare month: string;
  declare start_date: Date;
  declare end_date: Date;
  declare status: number;
  declare created: Date;

  public static associate(models: any) {
  }
}

CrmTargetDates.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    month: {
      type: DataTypes.STRING(100),
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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmTargetDates',
    tableName: 'crm_target_dates',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmTargetDates };
export type { CrmTargetDatesAttributes, CrmTargetDatesCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmFeeAttributes {
  id: number;
  service: number | null;
  country: number | null;
  branch: number | null;
  currency: number | null;
  upfront: number;
  prof_fee: number;
  firstMonth: number;
  secondMonth: number;
  thirdMonth: number;
  prof_fee_month: number;
  firstStage: number;
  secondStage: number;
  thirdStage: number;
  forthStage: number;
  fifthStage: number;
  prof_fee_stage: number;
  status: number;
}

interface CrmFeeCreationAttributes extends Optional<CrmFeeAttributes, 'service' | 'country' | 'branch' | 'currency' | 'upfront' | 'prof_fee' | 'firstMonth' | 'secondMonth' | 'thirdMonth' | 'prof_fee_month' | 'firstStage' | 'secondStage' | 'thirdStage' | 'forthStage' | 'prof_fee_stage' | 'status'> {}

class CrmFee extends Model<CrmFeeAttributes, CrmFeeCreationAttributes> implements CrmFeeAttributes {
  declare id: number;
  declare service: number | null;
  declare country: number | null;
  declare branch: number | null;
  declare currency: number | null;
  declare upfront: number;
  declare prof_fee: number;
  declare firstMonth: number;
  declare secondMonth: number;
  declare thirdMonth: number;
  declare prof_fee_month: number;
  declare firstStage: number;
  declare secondStage: number;
  declare thirdStage: number;
  declare forthStage: number;
  declare fifthStage: number;
  declare prof_fee_stage: number;
  declare status: number;

  public static associate(models: any) {
    CrmFee.belongsTo(models.CrmBranch, { foreignKey: 'branch', targetKey: 'id', as: 'dmBranch' });
    CrmFee.belongsTo(models.CrmCountryProces, { foreignKey: 'country', targetKey: 'id', as: 'dmCountryProces' });
    CrmFee.belongsTo(models.CrmCurrency, { foreignKey: 'currency', targetKey: 'id', as: 'dmCurrency' });
    CrmFee.belongsTo(models.CrmService, { foreignKey: 'service', targetKey: 'id', as: 'dmService' });
  }
}

CrmFee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    service: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    country: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currency: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    upfront: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    prof_fee: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    firstMonth: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    secondMonth: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    thirdMonth: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    prof_fee_month: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    firstStage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    secondStage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    thirdStage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    forthStage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    fifthStage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    prof_fee_stage: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
  },
  {
    sequelize,
    modelName: 'CrmFee',
    tableName: 'crm_fee',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmFee };
export type { CrmFeeAttributes, CrmFeeCreationAttributes };

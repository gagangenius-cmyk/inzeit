import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmExchangeRateAttributes {
  id: number;
  currency_code: string;
  rate_to_aed: number;
  status: number;
  created_at: Date;
  updated_at: Date;
}

interface CrmExchangeRateCreationAttributes extends Optional<CrmExchangeRateAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class CrmExchangeRate extends Model<CrmExchangeRateAttributes, CrmExchangeRateCreationAttributes> implements CrmExchangeRateAttributes {
  declare id: number;
  declare currency_code: string;
  declare rate_to_aed: number;
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmExchangeRate.hasMany(models.CrmBranchExchangeRateMap, { foreignKey: 'exchange_rate_id', sourceKey: 'id', as: 'branchMappings' });
  }
}

CrmExchangeRate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    currency_code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    rate_to_aed: {
      type: DataTypes.DECIMAL(12, 6),
      allowNull: false,
      defaultValue: 1.0
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
  },
  {
    sequelize,
    modelName: 'CrmExchangeRate',
    tableName: 'crm_exchange_rate',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmExchangeRate };
export type { CrmExchangeRateAttributes, CrmExchangeRateCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmBranchExchangeRateMapAttributes {
  id: number;
  branch_id: number;
  exchange_rate_id: number;
  updated_at: Date;
}

interface CrmBranchExchangeRateMapCreationAttributes extends Optional<CrmBranchExchangeRateMapAttributes, 'id' | 'updated_at'> {}

class CrmBranchExchangeRateMap extends Model<CrmBranchExchangeRateMapAttributes, CrmBranchExchangeRateMapCreationAttributes> implements CrmBranchExchangeRateMapAttributes {
  declare id: number;
  declare branch_id: number;
  declare exchange_rate_id: number;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmBranchExchangeRateMap.belongsTo(models.CrmBranch, { foreignKey: 'branch_id', targetKey: 'id', as: 'branch' });
    CrmBranchExchangeRateMap.belongsTo(models.CrmExchangeRate, { foreignKey: 'exchange_rate_id', targetKey: 'id', as: 'exchangeRate' });
  }
}

CrmBranchExchangeRateMap.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    exchange_rate_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
  },
  {
    sequelize,
    modelName: 'CrmBranchExchangeRateMap',
    tableName: 'crm_branch_exchange_rate_map',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmBranchExchangeRateMap };
export type { CrmBranchExchangeRateMapAttributes, CrmBranchExchangeRateMapCreationAttributes };

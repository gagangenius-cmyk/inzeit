import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmCurrencyAttributes {
  id: number;
  country: string;
  currency_code: string;
  rate: number;
  status: number;
  created: Date;
}

interface CrmCurrencyCreationAttributes extends Optional<CrmCurrencyAttributes, never> {}

class CrmCurrency extends Model<CrmCurrencyAttributes, CrmCurrencyCreationAttributes> implements CrmCurrencyAttributes {
  declare id: number;
  declare country: string;
  declare currency_code: string;
  declare rate: number;
  declare status: number;
  declare created: Date;

  public static associate(models: any) {
    CrmCurrency.hasMany(models.CrmFee, { foreignKey: 'currency', sourceKey: 'id', as: 'dmFees' });
  }
}

CrmCurrency.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    currency_code: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    rate: {
      type: DataTypes.DECIMAL(10,2),
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
    modelName: 'CrmCurrency',
    tableName: 'crm_currency',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCurrency };
export type { CrmCurrencyAttributes, CrmCurrencyCreationAttributes };

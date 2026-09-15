import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmCountryProcesAttributes {
  id: number;
  name: string;
  status: number;
  sub_counteries: number;
}

interface CrmCountryProcesCreationAttributes extends Optional<CrmCountryProcesAttributes, 'status'> {}

class CrmCountryProces extends Model<CrmCountryProcesAttributes, CrmCountryProcesCreationAttributes> implements CrmCountryProcesAttributes {
  declare id: number;
  declare name: string;
  declare status: number;
  declare sub_counteries: number;

  public static associate(models: any) {
    CrmCountryProces.hasMany(models.CrmFee, { foreignKey: 'country', sourceKey: 'id', as: 'dmFees' });
    CrmCountryProces.hasMany(models.CrmCountriesTypeProgram, { foreignKey: 'country', sourceKey: 'id', as: 'countryPrograms' });
  }
}

CrmCountryProces.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    sub_counteries: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmCountryProces',
    tableName: 'crm_country_proces',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCountryProces };
export type { CrmCountryProcesAttributes, CrmCountryProcesCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmServiceAttributes {
  id: number;
  name: string;
  status: number;
  validity: string | null;
  flag: string | null;
  slogan_logo: string | null;
}

interface CrmServiceCreationAttributes extends Optional<CrmServiceAttributes, 'status' | 'validity' | 'flag' | 'slogan_logo'> {}

class CrmService extends Model<CrmServiceAttributes, CrmServiceCreationAttributes> implements CrmServiceAttributes {
  declare id: number;
  declare name: string;
  declare status: number;
  declare validity: string | null;
  declare flag: string | null;
  declare slogan_logo: string | null;

  public static associate(models: any) {
    CrmService.hasMany(models.CrmFee, { foreignKey: 'service', sourceKey: 'id', as: 'dmFees' });
    CrmService.hasMany(models.CrmCountriesTypeProgram, { foreignKey: 'program', sourceKey: 'id', as: 'countryPrograms' });
  }
}

CrmService.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    validity: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    flag: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    slogan_logo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmService',
    tableName: 'crm_service',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmService };
export type { CrmServiceAttributes, CrmServiceCreationAttributes };

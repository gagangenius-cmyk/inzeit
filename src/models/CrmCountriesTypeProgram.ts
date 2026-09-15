import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmCountriesTypeProgramAttributes {
  id: number;
  country: number;
  type: number;
  program: number;
  created: Date;
  created_by: number;
}

interface CrmCountriesTypeProgramCreationAttributes extends Optional<CrmCountriesTypeProgramAttributes, never> {}

class CrmCountriesTypeProgram extends Model<CrmCountriesTypeProgramAttributes, CrmCountriesTypeProgramCreationAttributes> implements CrmCountriesTypeProgramAttributes {
  declare id: number;
  declare country: number;
  declare type: number;
  declare program: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
    CrmCountriesTypeProgram.belongsTo(models.CrmCountryProces, { foreignKey: 'country', targetKey: 'id', as: 'countryDetails' });
    CrmCountriesTypeProgram.belongsTo(models.CrmService, { foreignKey: 'program', targetKey: 'id', as: 'programDetails' });
    CrmCountriesTypeProgram.belongsTo(models.CrmProgramType, { foreignKey: 'type', targetKey: 'id', as: 'typeDetails' });
  }
}

CrmCountriesTypeProgram.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    country: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    program: {
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
    modelName: 'CrmCountriesTypeProgram',
    tableName: 'crm_countries_type_program',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCountriesTypeProgram };
export type { CrmCountriesTypeProgramAttributes, CrmCountriesTypeProgramCreationAttributes };

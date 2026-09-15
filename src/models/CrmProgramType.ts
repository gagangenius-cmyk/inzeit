import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmProgramTypeAttributes {
  id: number;
  type: string;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmProgramTypeCreationAttributes extends Optional<CrmProgramTypeAttributes, never> {}

class CrmProgramType extends Model<CrmProgramTypeAttributes, CrmProgramTypeCreationAttributes> implements CrmProgramTypeAttributes {
  declare id: number;
  declare type: string;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
    CrmProgramType.hasMany(models.CrmCountriesTypeProgram, { foreignKey: 'type', sourceKey: 'id', as: 'countryPrograms' });
  }
}

CrmProgramType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    type: {
      type: DataTypes.STRING(255),
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
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmProgramType',
    tableName: 'crm_program_type',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmProgramType };
export type { CrmProgramTypeAttributes, CrmProgramTypeCreationAttributes };

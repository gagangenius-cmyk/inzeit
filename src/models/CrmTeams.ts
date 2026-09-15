import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmTeamsAttributes {
  id: number;
  team: string;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmTeamsCreationAttributes extends Optional<CrmTeamsAttributes, never> {}

class CrmTeams extends Model<CrmTeamsAttributes, CrmTeamsCreationAttributes> implements CrmTeamsAttributes {
  declare id: number;
  declare team: string;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmTeams.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    team: {
      type: DataTypes.STRING(100),
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
    modelName: 'CrmTeams',
    tableName: 'crm_teams',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmTeams };
export type { CrmTeamsAttributes, CrmTeamsCreationAttributes };

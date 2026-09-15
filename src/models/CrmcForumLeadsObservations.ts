import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsObservationsAttributes {
  id: number;
  leadId: number;
  sheet: string;
  emirateId: string;
  document: string;
  remark: string;
  os_visit_sheet: string;
  visit_obs_type: string;
  created: Date;
  created_by: number;
}

interface CrmcForumLeadsObservationsCreationAttributes extends Optional<CrmcForumLeadsObservationsAttributes, never> {}

class CrmcForumLeadsObservations extends Model<CrmcForumLeadsObservationsAttributes, CrmcForumLeadsObservationsCreationAttributes> implements CrmcForumLeadsObservationsAttributes {
  declare id: number;
  declare leadId: number;
  declare sheet: string;
  declare emirateId: string;
  declare document: string;
  declare remark: string;
  declare os_visit_sheet: string;
  declare visit_obs_type: string;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
    CrmcForumLeadsObservations.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmcForumLeadsObservations.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sheet: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    emirateId: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    os_visit_sheet: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    visit_obs_type: {
      type: DataTypes.STRING(100),
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
    modelName: 'CrmcForumLeadsObservations',
    tableName: 'crm_forum_leads_observations',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsObservations };
export type { CrmcForumLeadsObservationsAttributes, CrmcForumLeadsObservationsCreationAttributes };

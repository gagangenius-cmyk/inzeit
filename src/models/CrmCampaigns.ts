import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmCampaignsAttributes {
  id: number;
  campaign: string;
  created: Date;
  created_by: number;
  status: number;
}

interface CrmCampaignsCreationAttributes extends Optional<CrmCampaignsAttributes, never> {}

class CrmCampaigns extends Model<CrmCampaignsAttributes, CrmCampaignsCreationAttributes> implements CrmCampaignsAttributes {
  declare id: number;
  declare campaign: string;
  declare created: Date;
  declare created_by: number;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmCampaigns.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    campaign: {
      type: DataTypes.STRING(50),
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
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmCampaigns',
    tableName: 'crm_campaigns',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCampaigns };
export type { CrmCampaignsAttributes, CrmCampaignsCreationAttributes };

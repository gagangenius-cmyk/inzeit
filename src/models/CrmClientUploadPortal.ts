import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmClientUploadPortalAttributes {
  id: number;
  clientId: string;
  leadId: number;
  opportunityId: number | null;
  agreementNumber: string | null;
  accessToken: string;
  status: 'active' | 'closed' | 'expired';
  expiresAt: Date | null;
  createdAt: Date;
}

interface CrmClientUploadPortalCreationAttributes extends Optional<CrmClientUploadPortalAttributes, 'id' | 'opportunityId' | 'agreementNumber' | 'expiresAt'> {}

class CrmClientUploadPortal extends Model<CrmClientUploadPortalAttributes, CrmClientUploadPortalCreationAttributes> implements CrmClientUploadPortalAttributes {
  declare id: number;
  declare clientId: string;
  declare leadId: number;
  declare opportunityId: number | null;
  declare agreementNumber: string | null;
  declare accessToken: string;
  declare status: 'active' | 'closed' | 'expired';
  declare expiresAt: Date | null;
  declare createdAt: Date;

  public static associate(models: any) {
    CrmClientUploadPortal.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'lead' });
    CrmClientUploadPortal.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'opportunity' });
  }
}

CrmClientUploadPortal.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    clientId: {
      type: DataTypes.STRING(40),
      allowNull: false,
      unique: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_forum_leads',
        key: 'id'
      }
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'crm_opportunities',
        key: 'id'
      }
    },
    agreementNumber: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    accessToken: {
      type: DataTypes.CHAR(64),
      allowNull: false,
      unique: true
    },
    status: {
      type: DataTypes.ENUM('active', 'closed', 'expired'),
      allowNull: false,
      defaultValue: 'active'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'CrmClientUploadPortal',
    tableName: 'crm_client_upload_portals',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmClientUploadPortal };
export type { CrmClientUploadPortalAttributes, CrmClientUploadPortalCreationAttributes };

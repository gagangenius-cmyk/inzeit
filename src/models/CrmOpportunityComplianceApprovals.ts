import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityComplianceApprovalsAttributes {
  id: number;
  leadId: number;
  opportunityId: number | null;
  signedAgreementUrl: string;
  clientSignature: string | null;
  signatureDate: Date | null;
  status: string;
  submittedBy: number | null;
  reviewedBy: string | null;
  reviewerRole: string | null;
  reviewNotes: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmOpportunityComplianceApprovalsCreationAttributes extends Optional<CrmOpportunityComplianceApprovalsAttributes, 'id' | 'opportunityId' | 'clientSignature' | 'signatureDate' | 'status' | 'submittedBy' | 'reviewedBy' | 'reviewerRole' | 'reviewNotes' | 'reviewedAt'> {}

class CrmOpportunityComplianceApprovals extends Model<CrmOpportunityComplianceApprovalsAttributes, CrmOpportunityComplianceApprovalsCreationAttributes> implements CrmOpportunityComplianceApprovalsAttributes {
  declare id: number;
  declare leadId: number;
  declare opportunityId: number | null;
  declare signedAgreementUrl: string;
  declare clientSignature: string | null;
  declare signatureDate: Date | null;
  declare status: string;
  declare submittedBy: number | null;
  declare reviewedBy: string | null;
  declare reviewerRole: string | null;
  declare reviewNotes: string | null;
  declare submittedAt: Date;
  declare reviewedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmOpportunityComplianceApprovals.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'lead' });
    CrmOpportunityComplianceApprovals.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityComplianceApprovals.belongsTo(models.CrmEmployee, { foreignKey: 'submittedBy', targetKey: 'id', as: 'submittedEmployee' });
  }
}

CrmOpportunityComplianceApprovals.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    leadId: { type: DataTypes.INTEGER, allowNull: false },
    opportunityId: { type: DataTypes.INTEGER, allowNull: true },
    signedAgreementUrl: { type: DataTypes.TEXT, allowNull: false },
    clientSignature: { type: DataTypes.STRING(255), allowNull: true },
    signatureDate: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
    submittedBy: { type: DataTypes.INTEGER, allowNull: true },
    reviewedBy: { type: DataTypes.STRING(255), allowNull: true },
    reviewerRole: { type: DataTypes.STRING(80), allowNull: true },
    reviewNotes: { type: DataTypes.TEXT, allowNull: true },
    submittedAt: { type: DataTypes.DATE, allowNull: false },
    reviewedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityComplianceApprovals',
    tableName: 'crm_opportunity_compliance_approvals',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmOpportunityComplianceApprovals };
export type { CrmOpportunityComplianceApprovalsAttributes, CrmOpportunityComplianceApprovalsCreationAttributes };

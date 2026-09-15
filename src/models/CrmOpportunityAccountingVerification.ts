import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityAccountingVerificationAttributes {
  id: number;
  leadId: number;
  opportunityId: number;
  paymentProofUrl: string | null;
  paymentReceived: boolean;
  documentsComplete: boolean;
  status: 'pending' | 'approved' | 'rejected';
  accountantId: number | null;
  notes: string | null;
  submittedAt: Date;
  reviewedAt: Date | null;
}

interface CrmOpportunityAccountingVerificationCreationAttributes extends Optional<CrmOpportunityAccountingVerificationAttributes, 'id' | 'paymentProofUrl' | 'paymentReceived' | 'documentsComplete' | 'status' | 'accountantId' | 'notes' | 'reviewedAt'> {}

class CrmOpportunityAccountingVerification extends Model<CrmOpportunityAccountingVerificationAttributes, CrmOpportunityAccountingVerificationCreationAttributes> implements CrmOpportunityAccountingVerificationAttributes {
  declare id: number;
  declare leadId: number;
  declare opportunityId: number;
  declare paymentProofUrl: string | null;
  declare paymentReceived: boolean;
  declare documentsComplete: boolean;
  declare status: 'pending' | 'approved' | 'rejected';
  declare accountantId: number | null;
  declare notes: string | null;
  declare submittedAt: Date;
  declare reviewedAt: Date | null;

  public static associate(models: any) {
    CrmOpportunityAccountingVerification.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
    CrmOpportunityAccountingVerification.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunity_id', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityAccountingVerification.belongsTo(models.CrmEmployee, { foreignKey: 'accountant_id', targetKey: 'id', as: 'accountant' });
  }
}

CrmOpportunityAccountingVerification.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    leadId: { type: DataTypes.INTEGER, allowNull: false, field: 'lead_id', references: { model: 'crm_forum_leads', key: 'id' } },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false, field: 'opportunity_id', references: { model: 'crm_opportunities', key: 'id' } },
    paymentProofUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'payment_proof_url' },
    paymentReceived: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'payment_received' },
    documentsComplete: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'documents_complete' },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending', field: 'status' },
    accountantId: { type: DataTypes.INTEGER, allowNull: true, field: 'accountant_id', references: { model: 'crm_employee', key: 'id' } },
    notes: { type: DataTypes.TEXT, allowNull: true, field: 'notes' },
    submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'submitted_at' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityAccountingVerification',
    tableName: 'crm_opportunity_accounting_verifications',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmOpportunityAccountingVerification };
export type { CrmOpportunityAccountingVerificationAttributes, CrmOpportunityAccountingVerificationCreationAttributes };

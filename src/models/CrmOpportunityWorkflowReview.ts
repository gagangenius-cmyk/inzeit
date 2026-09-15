import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityWorkflowReviewAttributes {
  id: number;
  opportunityId: number;
  leadId: number;
  workflowStatus: string;
  officialIdData: string | null;
  paymentData: string | null;
  financeStatus: 'pending' | 'approved' | 'rejected';
  financeChecklist: string | null;
  financeReason: string | null;
  financeReviewedBy: number | null;
  financeReviewedAt: Date | null;
  complianceStatus: 'pending' | 'approved' | 'rejected';
  complianceChecklist: string | null;
  complianceReason: string | null;
  complianceReviewedBy: number | null;
  complianceReviewedAt: Date | null;
  formalClientId: string | null;
  caseActivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmOpportunityWorkflowReviewCreationAttributes extends Optional<CrmOpportunityWorkflowReviewAttributes, 'id' | 'officialIdData' | 'paymentData' | 'financeStatus' | 'financeChecklist' | 'financeReason' | 'financeReviewedBy' | 'financeReviewedAt' | 'complianceStatus' | 'complianceChecklist' | 'complianceReason' | 'complianceReviewedBy' | 'complianceReviewedAt' | 'formalClientId' | 'caseActivatedAt' | 'createdAt' | 'updatedAt'> {}

class CrmOpportunityWorkflowReview extends Model<CrmOpportunityWorkflowReviewAttributes, CrmOpportunityWorkflowReviewCreationAttributes> implements CrmOpportunityWorkflowReviewAttributes {
  declare id: number;
  declare opportunityId: number;
  declare leadId: number;
  declare workflowStatus: string;
  declare officialIdData: string | null;
  declare paymentData: string | null;
  declare financeStatus: 'pending' | 'approved' | 'rejected';
  declare financeChecklist: string | null;
  declare financeReason: string | null;
  declare financeReviewedBy: number | null;
  declare financeReviewedAt: Date | null;
  declare complianceStatus: 'pending' | 'approved' | 'rejected';
  declare complianceChecklist: string | null;
  declare complianceReason: string | null;
  declare complianceReviewedBy: number | null;
  declare complianceReviewedAt: Date | null;
  declare formalClientId: string | null;
  declare caseActivatedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmOpportunityWorkflowReview.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunity_id', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityWorkflowReview.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
    CrmOpportunityWorkflowReview.belongsTo(models.CrmEmployee, { foreignKey: 'finance_reviewed_by', targetKey: 'id', as: 'financeReviewer' });
    CrmOpportunityWorkflowReview.belongsTo(models.CrmEmployee, { foreignKey: 'compliance_reviewed_by', targetKey: 'id', as: 'complianceReviewer' });
  }
}

CrmOpportunityWorkflowReview.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false, unique: true, field: 'opportunity_id', references: { model: 'crm_opportunities', key: 'id' } },
    leadId: { type: DataTypes.INTEGER, allowNull: false, field: 'lead_id', references: { model: 'crm_forum_leads', key: 'id' } },
    workflowStatus: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'opportunity_created', field: 'workflow_status' },
    officialIdData: { type: DataTypes.JSON, allowNull: true, field: 'official_id_data' },
    paymentData: { type: DataTypes.JSON, allowNull: true, field: 'payment_data' },
    financeStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending', field: 'finance_status' },
    financeChecklist: { type: DataTypes.JSON, allowNull: true, field: 'finance_checklist' },
    financeReason: { type: DataTypes.TEXT, allowNull: true, field: 'finance_reason' },
    financeReviewedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'finance_reviewed_by', references: { model: 'crm_employee', key: 'id' } },
    financeReviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'finance_reviewed_at' },
    complianceStatus: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending', field: 'compliance_status' },
    complianceChecklist: { type: DataTypes.JSON, allowNull: true, field: 'compliance_checklist' },
    complianceReason: { type: DataTypes.TEXT, allowNull: true, field: 'compliance_reason' },
    complianceReviewedBy: { type: DataTypes.INTEGER, allowNull: true, field: 'compliance_reviewed_by', references: { model: 'crm_employee', key: 'id' } },
    complianceReviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'compliance_reviewed_at' },
    formalClientId: { type: DataTypes.STRING(40), allowNull: true, unique: true, field: 'formal_client_id' },
    caseActivatedAt: { type: DataTypes.DATE, allowNull: true, field: 'case_activated_at' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityWorkflowReview',
    tableName: 'crm_opportunity_workflow_reviews',
    timestamps: false,
    freezeTableName: true,
    underscored: true,
  }
);

export { CrmOpportunityWorkflowReview };
export type { CrmOpportunityWorkflowReviewAttributes, CrmOpportunityWorkflowReviewCreationAttributes };

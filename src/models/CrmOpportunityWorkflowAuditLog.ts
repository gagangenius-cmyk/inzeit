import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityWorkflowAuditLogAttributes {
  id: number;
  opportunityId: number;
  action: string;
  previousStatus: string | null;
  newStatus: string;
  actorId: number | null;
  actorRole: string | null;
  notes: string | null;
  createdAt: Date;
}

interface CrmOpportunityWorkflowAuditLogCreationAttributes extends Optional<CrmOpportunityWorkflowAuditLogAttributes, 'id' | 'previousStatus' | 'actorId' | 'actorRole' | 'notes' | 'createdAt'> {}

class CrmOpportunityWorkflowAuditLog extends Model<CrmOpportunityWorkflowAuditLogAttributes, CrmOpportunityWorkflowAuditLogCreationAttributes> implements CrmOpportunityWorkflowAuditLogAttributes {
  declare id: number;
  declare opportunityId: number;
  declare action: string;
  declare previousStatus: string | null;
  declare newStatus: string;
  declare actorId: number | null;
  declare actorRole: string | null;
  declare notes: string | null;
  declare createdAt: Date;

  public static associate(models: any) {
    CrmOpportunityWorkflowAuditLog.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunity_id', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityWorkflowAuditLog.belongsTo(models.CrmEmployee, { foreignKey: 'actor_id', targetKey: 'id', as: 'actor' });
  }
}

CrmOpportunityWorkflowAuditLog.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false, field: 'opportunity_id', references: { model: 'crm_opportunities', key: 'id' } },
    action: { type: DataTypes.STRING(80), allowNull: false, field: 'action' },
    previousStatus: { type: DataTypes.STRING(50), allowNull: true, field: 'previous_status' },
    newStatus: { type: DataTypes.STRING(50), allowNull: false, field: 'new_status' },
    actorId: { type: DataTypes.INTEGER, allowNull: true, field: 'actor_id', references: { model: 'crm_employee', key: 'id' } },
    actorRole: { type: DataTypes.STRING(80), allowNull: true, field: 'actor_role' },
    notes: { type: DataTypes.TEXT, allowNull: true, field: 'notes' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityWorkflowAuditLog',
    tableName: 'crm_opportunity_workflow_audit_logs',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmOpportunityWorkflowAuditLog };
export type { CrmOpportunityWorkflowAuditLogAttributes, CrmOpportunityWorkflowAuditLogCreationAttributes };

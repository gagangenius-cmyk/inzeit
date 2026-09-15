import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityHandoverNoteAttributes {
  id: number;
  leadId: number;
  opportunityId: number | null;
  counselorId: number | null;
  conversationSummary: string;
  clientCommitments: string | null;
  nextAction: string | null;
  createdAt: Date;
}

interface CrmOpportunityHandoverNoteCreationAttributes extends Optional<CrmOpportunityHandoverNoteAttributes, 'id' | 'opportunityId' | 'counselorId' | 'clientCommitments' | 'nextAction' | 'createdAt'> {}

class CrmOpportunityHandoverNote extends Model<CrmOpportunityHandoverNoteAttributes, CrmOpportunityHandoverNoteCreationAttributes> implements CrmOpportunityHandoverNoteAttributes {
  declare id: number;
  declare leadId: number;
  declare opportunityId: number | null;
  declare counselorId: number | null;
  declare conversationSummary: string;
  declare clientCommitments: string | null;
  declare nextAction: string | null;
  declare createdAt: Date;

  public static associate(models: any) {
    CrmOpportunityHandoverNote.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
    CrmOpportunityHandoverNote.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunity_id', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityHandoverNote.belongsTo(models.CrmEmployee, { foreignKey: 'counselor_id', targetKey: 'id', as: 'counselor' });
  }
}

CrmOpportunityHandoverNote.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    leadId: { type: DataTypes.INTEGER, allowNull: false, field: 'lead_id', references: { model: 'crm_forum_leads', key: 'id' } },
    opportunityId: { type: DataTypes.INTEGER, allowNull: true, field: 'opportunity_id', references: { model: 'crm_opportunities', key: 'id' } },
    counselorId: { type: DataTypes.INTEGER, allowNull: true, field: 'counselor_id', references: { model: 'crm_employee', key: 'id' } },
    conversationSummary: { type: DataTypes.TEXT, allowNull: false, field: 'conversation_summary' },
    clientCommitments: { type: DataTypes.TEXT, allowNull: true, field: 'client_commitments' },
    nextAction: { type: DataTypes.TEXT, allowNull: true, field: 'next_action' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityHandoverNote',
    tableName: 'crm_opportunity_handover_notes',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmOpportunityHandoverNote };
export type { CrmOpportunityHandoverNoteAttributes, CrmOpportunityHandoverNoteCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmCallRequestAttributes {
  id: number;
  branch_id: number;
  lead_id: number | null;
  opportunity_id: number | null;
  requested_by: number | null;
  assigned_to: number | null;
  status: string;
  is_high_escalation: number;
  notes: string | null;
  requested_at: Date;
  completed_at: Date | null;
  created_by: number | null;
}

interface CrmCallRequestCreationAttributes extends Optional<CrmCallRequestAttributes, 'id' | 'lead_id' | 'opportunity_id' | 'requested_by' | 'assigned_to' | 'status' | 'is_high_escalation' | 'notes' | 'requested_at' | 'completed_at' | 'created_by'> {}

class CrmCallRequest extends Model<CrmCallRequestAttributes, CrmCallRequestCreationAttributes> implements CrmCallRequestAttributes {
  declare id: number;
  declare branch_id: number;
  declare lead_id: number | null;
  declare opportunity_id: number | null;
  declare requested_by: number | null;
  declare assigned_to: number | null;
  declare status: string;
  declare is_high_escalation: number;
  declare notes: string | null;
  declare requested_at: Date;
  declare completed_at: Date | null;
  declare created_by: number | null;

  public static associate(models: any) {
    CrmCallRequest.belongsTo(models.CrmBranch, { foreignKey: 'branch_id', targetKey: 'id', as: 'branchDetails' });
    CrmCallRequest.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
    CrmCallRequest.belongsTo(models.CrmEmployee, { foreignKey: 'requested_by', targetKey: 'id', as: 'requestedByEmployee' });
    CrmCallRequest.belongsTo(models.CrmEmployee, { foreignKey: 'assigned_to', targetKey: 'id', as: 'assignedToEmployee' });
  }
}

CrmCallRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    opportunity_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending'
    },
    is_high_escalation: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    requested_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmCallRequest',
    tableName: 'crm_call_requests',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCallRequest };
export type { CrmCallRequestAttributes, CrmCallRequestCreationAttributes };

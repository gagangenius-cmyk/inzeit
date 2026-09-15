import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpsAssignmentAttributes {
  id: number;
  type: 'call' | 'task' | 'appointment';
  title: string;
  notes: string | null;
  outcome_remark: string | null;
  lead_id: number | null;
  opportunity_id: number | null;
  assigned_to: number;
  assigned_by: number;
  due_at: Date | null;
  status: string;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface CrmOpsAssignmentCreationAttributes
  extends Optional<
    CrmOpsAssignmentAttributes,
    'id' | 'notes' | 'outcome_remark' | 'lead_id' | 'opportunity_id' | 'due_at' | 'status' | 'completed_at' | 'created_at' | 'updated_at'
  > {}

class CrmOpsAssignment
  extends Model<CrmOpsAssignmentAttributes, CrmOpsAssignmentCreationAttributes>
  implements CrmOpsAssignmentAttributes
{
  declare id: number;
  declare type: 'call' | 'task' | 'appointment';
  declare title: string;
  declare notes: string | null;
  declare outcome_remark: string | null;
  declare lead_id: number | null;
  declare opportunity_id: number | null;
  declare assigned_to: number;
  declare assigned_by: number;
  declare due_at: Date | null;
  declare status: string;
  declare completed_at: Date | null;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmOpsAssignment.belongsTo(models.CrmEmployee, { foreignKey: 'assigned_to', targetKey: 'id', as: 'assignedToEmployee' });
    CrmOpsAssignment.belongsTo(models.CrmEmployee, { foreignKey: 'assigned_by', targetKey: 'id', as: 'assignedByEmployee' });
    CrmOpsAssignment.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
  }
}

CrmOpsAssignment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.ENUM('call', 'task', 'appointment'),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    outcome_remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    opportunity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    due_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CrmOpsAssignment',
    tableName: 'crm_ops_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  },
);

export { CrmOpsAssignment };
export type { CrmOpsAssignmentAttributes, CrmOpsAssignmentCreationAttributes };

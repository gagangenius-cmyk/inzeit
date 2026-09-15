import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcAutoReassignmentRulesAttributes {
  id: number;
  rule_name: string;
  description: string | null;
  inactive_hours_threshold: number;
  auto_reassign: boolean;
  reassign_to_role: string;
  reassign_to_branch: number;
  priority_filter: string;
  lead_quality_filter: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface CrmcAutoReassignmentRulesCreationAttributes extends Optional<CrmcAutoReassignmentRulesAttributes, 'id' | 'description' | 'inactive_hours_threshold' | 'auto_reassign' | 'reassign_to_role' | 'reassign_to_branch' | 'priority_filter' | 'lead_quality_filter' | 'is_active' | 'created_at' | 'updated_at'> {}

class CrmcAutoReassignmentRules extends Model<CrmcAutoReassignmentRulesAttributes, CrmcAutoReassignmentRulesCreationAttributes> implements CrmcAutoReassignmentRulesAttributes {
  declare id: number;
  declare rule_name: string;
  declare description: string | null;
  declare inactive_hours_threshold: number;
  declare auto_reassign: boolean;
  declare reassign_to_role: string;
  declare reassign_to_branch: number;
  declare priority_filter: string;
  declare lead_quality_filter: string;
  declare is_active: boolean;
  declare created_at: Date;
  declare updated_at: Date;
}

CrmcAutoReassignmentRules.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    rule_name: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    inactive_hours_threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 6 },
    auto_reassign: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    reassign_to_role: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'available' },
    reassign_to_branch: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    priority_filter: { type: DataTypes.STRING(50), allowNull: false, defaultValue: '' },
    lead_quality_filter: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmcAutoReassignmentRules',
    tableName: 'crm_auto_reassignment_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmcAutoReassignmentRules };
export type { CrmcAutoReassignmentRulesAttributes, CrmcAutoReassignmentRulesCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

// See src/lib/assignmentRuleEngine.ts, which is the actual read/write path
// for this table (raw SQL, matching this codebase's dominant data-access
// style) - this model exists for discoverability/associations/admin
// tooling, not as the primary way the app touches crm_assignment_rules.
interface CrmAssignmentRuleAttributes {
  id: number;
  name: string;
  description: string | null;
  is_active: number;
  sort_order: number;
  branch_ids: string | null;
  source_ids: string | null;
  priorities: string | null;
  lead_qualities: string | null;
  country_interest_ids: string | null;
  service_interest_ids: string | null;
  assignment_mode: string;
  employee_ids: string;
  created_at: Date;
  updated_at: Date;
  created_by: number | null;
  updated_by: number | null;
}

interface CrmAssignmentRuleCreationAttributes extends Optional<CrmAssignmentRuleAttributes,
  'id' | 'description' | 'is_active' | 'sort_order' | 'branch_ids' | 'source_ids' | 'priorities'
  | 'lead_qualities' | 'country_interest_ids' | 'service_interest_ids' | 'created_at' | 'updated_at'
  | 'created_by' | 'updated_by'
> {}

class CrmAssignmentRule extends Model<CrmAssignmentRuleAttributes, CrmAssignmentRuleCreationAttributes> implements CrmAssignmentRuleAttributes {
  declare id: number;
  declare name: string;
  declare description: string | null;
  declare is_active: number;
  declare sort_order: number;
  declare branch_ids: string | null;
  declare source_ids: string | null;
  declare priorities: string | null;
  declare lead_qualities: string | null;
  declare country_interest_ids: string | null;
  declare service_interest_ids: string | null;
  declare assignment_mode: string;
  declare employee_ids: string;
  declare created_at: Date;
  declare updated_at: Date;
  declare created_by: number | null;
  declare updated_by: number | null;

  public static associate(models: any) {
    CrmAssignmentRule.belongsTo(models.CrmEmployee, { foreignKey: 'created_by', targetKey: 'id', as: 'createdByEmployee' });
    CrmAssignmentRule.belongsTo(models.CrmEmployee, { foreignKey: 'updated_by', targetKey: 'id', as: 'updatedByEmployee' });
    CrmAssignmentRule.hasOne(models.CrmAssignmentRuleState, { foreignKey: 'rule_id', sourceKey: 'id', as: 'state' });
  }
}

CrmAssignmentRule.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(150), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    branch_ids: { type: DataTypes.STRING(255), allowNull: true },
    source_ids: { type: DataTypes.STRING(255), allowNull: true },
    priorities: { type: DataTypes.STRING(150), allowNull: true },
    lead_qualities: { type: DataTypes.STRING(255), allowNull: true },
    country_interest_ids: { type: DataTypes.STRING(255), allowNull: true },
    service_interest_ids: { type: DataTypes.STRING(255), allowNull: true },
    assignment_mode: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'round_robin' },
    employee_ids: { type: DataTypes.STRING(1000), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
    updated_by: { type: DataTypes.INTEGER, allowNull: true },
  },
  {
    sequelize,
    modelName: 'CrmAssignmentRule',
    tableName: 'crm_assignment_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmAssignmentRule };
export type { CrmAssignmentRuleAttributes, CrmAssignmentRuleCreationAttributes };

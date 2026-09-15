import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

// See src/lib/targetAssignment.ts, which is the actual read/write path for
// this table (raw SQL, matching this codebase's dominant data-access style)
// - this model exists for discoverability/associations/admin tooling, not
// as the primary way the app touches crm_employee_targets.
interface CrmEmployeeTargetAttributes {
  id: number;
  employee_id: number;
  assigned_by: number | null;
  target_month: string;
  target_type: string;
  meetings_target: number | null;
  appointments_target: number | null;
  sales_revenue_target: number | null;
  collection_target: number | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

interface CrmEmployeeTargetCreationAttributes extends Optional<CrmEmployeeTargetAttributes,
  'id' | 'assigned_by' | 'meetings_target' | 'appointments_target' | 'sales_revenue_target'
  | 'collection_target' | 'notes' | 'created_at' | 'updated_at'
> {}

class CrmEmployeeTarget extends Model<CrmEmployeeTargetAttributes, CrmEmployeeTargetCreationAttributes> implements CrmEmployeeTargetAttributes {
  declare id: number;
  declare employee_id: number;
  declare assigned_by: number | null;
  declare target_month: string;
  declare target_type: string;
  declare meetings_target: number | null;
  declare appointments_target: number | null;
  declare sales_revenue_target: number | null;
  declare collection_target: number | null;
  declare notes: string | null;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmEmployeeTarget.belongsTo(models.CrmEmployee, { foreignKey: 'employee_id', targetKey: 'id', as: 'employee' });
    CrmEmployeeTarget.belongsTo(models.CrmEmployee, { foreignKey: 'assigned_by', targetKey: 'id', as: 'assignedByEmployee' });
  }
}

CrmEmployeeTarget.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    employee_id: { type: DataTypes.INTEGER, allowNull: false },
    assigned_by: { type: DataTypes.INTEGER, allowNull: true },
    target_month: { type: DataTypes.DATEONLY, allowNull: false },
    target_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new_leads' },
    meetings_target: { type: DataTypes.INTEGER, allowNull: true },
    appointments_target: { type: DataTypes.INTEGER, allowNull: true },
    sales_revenue_target: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    collection_target: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'CrmEmployeeTarget',
    tableName: 'crm_employee_targets',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmEmployeeTarget };
export type { CrmEmployeeTargetAttributes, CrmEmployeeTargetCreationAttributes };

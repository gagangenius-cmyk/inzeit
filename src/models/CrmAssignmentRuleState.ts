import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmAssignmentRuleStateAttributes {
  rule_id: number;
  last_employee_id: number | null;
  created_at: Date;
  updated_at: Date;
}

interface CrmAssignmentRuleStateCreationAttributes extends Optional<CrmAssignmentRuleStateAttributes, 'last_employee_id' | 'created_at' | 'updated_at'> {}

class CrmAssignmentRuleState extends Model<CrmAssignmentRuleStateAttributes, CrmAssignmentRuleStateCreationAttributes> implements CrmAssignmentRuleStateAttributes {
  declare rule_id: number;
  declare last_employee_id: number | null;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmAssignmentRuleState.belongsTo(models.CrmAssignmentRule, { foreignKey: 'rule_id', targetKey: 'id', as: 'rule' });
    CrmAssignmentRuleState.belongsTo(models.CrmEmployee, { foreignKey: 'last_employee_id', targetKey: 'id', as: 'lastEmployee' });
  }
}

CrmAssignmentRuleState.init(
  {
    rule_id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
    last_employee_id: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    modelName: 'CrmAssignmentRuleState',
    tableName: 'crm_assignment_rule_state',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmAssignmentRuleState };
export type { CrmAssignmentRuleStateAttributes, CrmAssignmentRuleStateCreationAttributes };

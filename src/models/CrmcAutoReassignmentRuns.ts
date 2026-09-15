import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcAutoReassignmentRunsAttributes {
  id: number;
  processed: number;
  reassigned: number;
  created_at: Date;
}

interface CrmcAutoReassignmentRunsCreationAttributes extends Optional<CrmcAutoReassignmentRunsAttributes, 'id' | 'processed' | 'reassigned' | 'created_at'> {}

class CrmcAutoReassignmentRuns extends Model<CrmcAutoReassignmentRunsAttributes, CrmcAutoReassignmentRunsCreationAttributes> implements CrmcAutoReassignmentRunsAttributes {
  declare id: number;
  declare processed: number;
  declare reassigned: number;
  declare created_at: Date;
}

CrmcAutoReassignmentRuns.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    processed: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    reassigned: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmcAutoReassignmentRuns',
    tableName: 'crm_auto_reassignment_runs',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmcAutoReassignmentRuns };
export type { CrmcAutoReassignmentRunsAttributes, CrmcAutoReassignmentRunsCreationAttributes };

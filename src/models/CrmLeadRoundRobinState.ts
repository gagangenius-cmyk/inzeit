import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmLeadRoundRobinStateAttributes {
  branch_id: number;
  last_employee_id: number | null;
  created_at: Date;
  updated_at: Date;
}

interface CrmLeadRoundRobinStateCreationAttributes extends Optional<CrmLeadRoundRobinStateAttributes, 'last_employee_id' | 'created_at' | 'updated_at'> {}

class CrmLeadRoundRobinState extends Model<CrmLeadRoundRobinStateAttributes, CrmLeadRoundRobinStateCreationAttributes> implements CrmLeadRoundRobinStateAttributes {
  declare branch_id: number;
  declare last_employee_id: number | null;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmLeadRoundRobinState.belongsTo(models.CrmBranch, { foreignKey: 'branch_id', targetKey: 'id', as: 'branch' });
    CrmLeadRoundRobinState.belongsTo(models.CrmEmployee, { foreignKey: 'last_employee_id', targetKey: 'id', as: 'lastEmployee' });
  }
}

CrmLeadRoundRobinState.init(
  {
    branch_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
    },
    last_employee_id: {
      type: DataTypes.INTEGER,
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
    modelName: 'CrmLeadRoundRobinState',
    tableName: 'crm_lead_round_robin_state',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    freezeTableName: true,
  }
);

export { CrmLeadRoundRobinState };
export type { CrmLeadRoundRobinStateAttributes, CrmLeadRoundRobinStateCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOpportunityPaymentScheduleAttributes {
  id: number;
  opportunityId: number;
  installmentNumber: number;
  dueDate: Date;
  amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate: Date | null;
  receiptNumber: string | null;
  receiptUrl: string | null;
  notes: string | null;
  createdBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmOpportunityPaymentScheduleCreationAttributes extends Optional<CrmOpportunityPaymentScheduleAttributes, 'id' | 'paidDate' | 'receiptNumber' | 'receiptUrl' | 'notes' | 'createdBy' | 'createdAt' | 'updatedAt'> {}

class CrmOpportunityPaymentSchedule extends Model<CrmOpportunityPaymentScheduleAttributes, CrmOpportunityPaymentScheduleCreationAttributes> implements CrmOpportunityPaymentScheduleAttributes {
  declare id: number;
  declare opportunityId: number;
  declare installmentNumber: number;
  declare dueDate: Date;
  declare amount: number;
  declare status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  declare paidDate: Date | null;
  declare receiptNumber: string | null;
  declare receiptUrl: string | null;
  declare notes: string | null;
  declare createdBy: number | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmOpportunityPaymentSchedule.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunity_id', targetKey: 'id', as: 'opportunity' });
    CrmOpportunityPaymentSchedule.belongsTo(models.CrmEmployee, { foreignKey: 'created_by', targetKey: 'id', as: 'createdEmployee' });
  }
}

CrmOpportunityPaymentSchedule.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    opportunityId: { type: DataTypes.INTEGER, allowNull: false, field: 'opportunity_id', references: { model: 'crm_opportunities', key: 'id' } },
    installmentNumber: { type: DataTypes.INTEGER, allowNull: false, field: 'installment_number' },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false, field: 'amount' },
    status: { type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'), allowNull: false, defaultValue: 'pending', field: 'status' },
    paidDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'paid_date' },
    receiptNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'receipt_number' },
    receiptUrl: { type: DataTypes.STRING(500), allowNull: true, field: 'receipt_url' },
    notes: { type: DataTypes.TEXT, allowNull: true, field: 'notes' },
    createdBy: { type: DataTypes.INTEGER, allowNull: true, field: 'created_by', references: { model: 'crm_employee', key: 'id' } },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' }
  },
  {
    sequelize,
    modelName: 'CrmOpportunityPaymentSchedule',
    tableName: 'crm_opportunity_payment_schedules',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmOpportunityPaymentSchedule };
export type { CrmOpportunityPaymentScheduleAttributes, CrmOpportunityPaymentScheduleCreationAttributes };

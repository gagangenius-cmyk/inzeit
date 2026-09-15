import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmEvaluationReportsAttributes {
  id: number;
  leadId: number;
  eligibilitySummary: string;
  feePaid: number;
  discountApplied: number;
  receiptNumber: string | null;
  generatedBy: number;
  generatedAt: Date;
}

interface CrmEvaluationReportsCreationAttributes extends Optional<CrmEvaluationReportsAttributes, 'id' | 'discountApplied' | 'receiptNumber' | 'generatedAt'> {}

class CrmEvaluationReports extends Model<CrmEvaluationReportsAttributes, CrmEvaluationReportsCreationAttributes> implements CrmEvaluationReportsAttributes {
  declare id: number;
  declare leadId: number;
  declare eligibilitySummary: string;
  declare feePaid: number;
  declare discountApplied: number;
  declare receiptNumber: string | null;
  declare generatedBy: number;
  declare generatedAt: Date;

  public static associate(models: any) {
    CrmEvaluationReports.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLead' });
    CrmEvaluationReports.belongsTo(models.CrmEmployee, { foreignKey: 'generatedBy', targetKey: 'id', as: 'generatedEmployee' });
  }
}

CrmEvaluationReports.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'lead_id',
      references: {
        model: 'crm_forum_leads',
        key: 'id'
      }
    },
    eligibilitySummary: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'eligibility_summary'
    },
    feePaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'fee_paid'
    },
    discountApplied: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'discount_applied'
    },
    receiptNumber: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'receipt_number'
    },
    generatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'generated_by',
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    generatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'generated_at',
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'CrmEvaluationReports',
    tableName: 'crm_evaluation_reports',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmEvaluationReports };
export type { CrmEvaluationReportsAttributes, CrmEvaluationReportsCreationAttributes };

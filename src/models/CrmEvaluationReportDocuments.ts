import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmEvaluationReportDocumentsAttributes {
  id: number;
  leadId: number;
  documentLabel: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: number;
  uploadedAt: Date;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  verifiedBy: number | null;
  verifiedAt: Date | null;
  reviewNote: string | null;
}

interface CrmEvaluationReportDocumentsCreationAttributes extends Optional<CrmEvaluationReportDocumentsAttributes, 'id' | 'uploadedAt' | 'status' | 'verifiedBy' | 'verifiedAt' | 'reviewNote'> {}

class CrmEvaluationReportDocuments extends Model<CrmEvaluationReportDocumentsAttributes, CrmEvaluationReportDocumentsCreationAttributes> implements CrmEvaluationReportDocumentsAttributes {
  declare id: number;
  declare leadId: number;
  declare documentLabel: string;
  declare fileUrl: string;
  declare fileName: string;
  declare uploadedBy: number;
  declare uploadedAt: Date;
  declare status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  declare verifiedBy: number | null;
  declare verifiedAt: Date | null;
  declare reviewNote: string | null;

  public static associate(models: any) {
    CrmEvaluationReportDocuments.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLead' });
    CrmEvaluationReportDocuments.belongsTo(models.CrmEmployee, { foreignKey: 'uploadedBy', targetKey: 'id', as: 'uploadedEmployee' });
    CrmEvaluationReportDocuments.belongsTo(models.CrmEmployee, { foreignKey: 'verifiedBy', targetKey: 'id', as: 'verifiedEmployee' });
  }
}

CrmEvaluationReportDocuments.init(
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
    documentLabel: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'document_label'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'file_url'
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'file_name'
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'uploaded_by',
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    uploadedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'uploaded_at',
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'uploaded', 'verified', 'rejected'),
      allowNull: false,
      defaultValue: 'uploaded'
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'verified_by',
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'verified_at'
    },
    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'review_note'
    }
  },
  {
    sequelize,
    modelName: 'CrmEvaluationReportDocuments',
    tableName: 'crm_evaluation_report_documents',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmEvaluationReportDocuments };
export type { CrmEvaluationReportDocumentsAttributes, CrmEvaluationReportDocumentsCreationAttributes };

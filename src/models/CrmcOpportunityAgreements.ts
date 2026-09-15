import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcOpportunityAgreementsAttributes {
  id: number;
  opportunityId: number;
  agreementNumber: string;
  agreementType: string;
  templateId: number | null;
  agreementTitle: string;
  title: string | null;
  description: string | null;
  duration: string;
  startDate: Date;
  endDate: Date;
  amount: number;
  totalAmount: number | null;
  currency: string;
  terms: string;
  termsAndConditions: string | null;
  specialConditions: string;
  content: string | null;
  status: 'draft' | 'generated' | 'sent' | 'signed' | 'uploaded' | 'expired';
  generatedDate: Date;
  sentDate: Date | null;
  signedDate: Date | null;
  clientSignature: string | null;
  signatureDate: Date | null;
  documentUrl: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  companyName: string | null;
  companyAddress: string | null;
  uploadedToCrm: boolean;
  uploadedBy: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmcOpportunityAgreementsCreationAttributes extends Optional<CrmcOpportunityAgreementsAttributes, 'id' | 'templateId' | 'agreementTitle' | 'title' | 'description' | 'duration' | 'totalAmount' | 'termsAndConditions' | 'content' | 'sentDate' | 'signedDate' | 'clientSignature' | 'signatureDate' | 'documentUrl' | 'clientName' | 'clientEmail' | 'clientPhone' | 'companyName' | 'companyAddress'> {}

class CrmcOpportunityAgreements extends Model<CrmcOpportunityAgreementsAttributes, CrmcOpportunityAgreementsCreationAttributes> implements CrmcOpportunityAgreementsAttributes {
  declare id: number;
  declare opportunityId: number;
  declare agreementNumber: string;
  declare agreementType: string;
  declare templateId: number | null;
  declare agreementTitle: string;
  declare title: string | null;
  declare description: string | null;
  declare duration: string;
  declare startDate: Date;
  declare endDate: Date;
  declare amount: number;
  declare totalAmount: number | null;
  declare currency: string;
  declare terms: string;
  declare termsAndConditions: string | null;
  declare specialConditions: string;
  declare content: string | null;
  declare status: 'draft' | 'generated' | 'sent' | 'signed' | 'uploaded' | 'expired';
  declare generatedDate: Date;
  declare sentDate: Date | null;
  declare signedDate: Date | null;
  declare clientSignature: string | null;
  declare signatureDate: Date | null;
  declare documentUrl: string | null;
  declare clientName: string | null;
  declare clientEmail: string | null;
  declare clientPhone: string | null;
  declare companyName: string | null;
  declare companyAddress: string | null;
  declare uploadedToCrm: boolean;
  declare uploadedBy: number;
  declare createdBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmcOpportunityAgreements.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'dmcOpportunity' });
    CrmcOpportunityAgreements.belongsTo(models.CrmEmployee, { foreignKey: 'createdBy', targetKey: 'id', as: 'createdEmployee' });
    CrmcOpportunityAgreements.belongsTo(models.CrmEmployee, { foreignKey: 'uploadedBy', targetKey: 'id', as: 'uploadedEmployee' });
  }
}

CrmcOpportunityAgreements.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_opportunities',
        key: 'id'
      }
    },
    agreementNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    agreementType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    agreementTitle: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD'
    },
    terms: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    termsAndConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    specialConditions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'generated', 'sent', 'signed', 'uploaded', 'expired'),
      allowNull: false,
      defaultValue: 'draft'
    },
    generatedDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    sentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    signedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    clientSignature: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    signatureDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    documentUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    clientName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientEmail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    clientPhone: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    companyName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    companyAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploadedToCrm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'CrmcOpportunityAgreements',
    tableName: 'crm_opportunity_agreements',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcOpportunityAgreements };
export type { CrmcOpportunityAgreementsAttributes, CrmcOpportunityAgreementsCreationAttributes };

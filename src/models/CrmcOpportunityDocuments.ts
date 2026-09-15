import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcOpportunityDocumentsAttributes {
  id: number;
  opportunityId: number;
  documentType: string;
  documentName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  category: string;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
  uploadDate: Date;
  verifiedDate: Date | null;
  verifiedBy: number | null;
  expiryDate: Date | null;
  required: boolean;
  notes: string;
  uploadedBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmcOpportunityDocumentsCreationAttributes extends Optional<CrmcOpportunityDocumentsAttributes, 'id' | 'verifiedDate' | 'verifiedBy' | 'expiryDate'> {}

class CrmcOpportunityDocuments extends Model<CrmcOpportunityDocumentsAttributes, CrmcOpportunityDocumentsCreationAttributes> implements CrmcOpportunityDocumentsAttributes {
  declare id: number;
  declare opportunityId: number;
  declare documentType: string;
  declare documentName: string;
  declare fileName: string;
  declare filePath: string;
  declare fileSize: number;
  declare mimeType: string;
  declare category: string;
  declare status: 'pending' | 'uploaded' | 'verified' | 'rejected' | 'expired';
  declare uploadDate: Date;
  declare verifiedDate: Date | null;
  declare verifiedBy: number | null;
  declare expiryDate: Date | null;
  declare required: boolean;
  declare notes: string;
  declare uploadedBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmcOpportunityDocuments.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'dmcOpportunity' });
    CrmcOpportunityDocuments.belongsTo(models.CrmEmployee, { foreignKey: 'uploadedBy', targetKey: 'id', as: 'uploadedEmployee' });
    CrmcOpportunityDocuments.belongsTo(models.CrmEmployee, { foreignKey: 'verifiedBy', targetKey: 'id', as: 'verifiedEmployee' });
  }
}

CrmcOpportunityDocuments.init(
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
    documentType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    documentName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'uploaded', 'verified', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'pending'
    },
    uploadDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    verifiedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    expiryDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    required: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    uploadedBy: {
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
    modelName: 'CrmcOpportunityDocuments',
    tableName: 'crm_opportunity_documents',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcOpportunityDocuments };
export type { CrmcOpportunityDocumentsAttributes, CrmcOpportunityDocumentsCreationAttributes };

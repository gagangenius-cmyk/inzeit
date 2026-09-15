import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmAdditionalDocumentsAttributes {
  id: number;
  leadId: number;
  document: string;
  purpose: string;
  created: Date;
  created_by: number;
  remarks: string;
}

interface CrmAdditionalDocumentsCreationAttributes extends Optional<CrmAdditionalDocumentsAttributes, never> {}

class CrmAdditionalDocuments extends Model<CrmAdditionalDocumentsAttributes, CrmAdditionalDocumentsCreationAttributes> implements CrmAdditionalDocumentsAttributes {
  declare id: number;
  declare leadId: number;
  declare document: string;
  declare purpose: string;
  declare created: Date;
  declare created_by: number;
  declare remarks: string;

  public static associate(models: any) {
  }
}

CrmAdditionalDocuments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmAdditionalDocuments',
    tableName: 'crm_additional_documents',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmAdditionalDocuments };
export type { CrmAdditionalDocumentsAttributes, CrmAdditionalDocumentsCreationAttributes };

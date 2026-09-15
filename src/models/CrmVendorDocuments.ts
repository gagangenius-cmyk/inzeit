import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmVendorDocumentsAttributes {
  id: number;
  batch_id: number | null;
  doc_type: string | null;
  doc_uploaded_for: string | null;
  leadId: number | null;
  tab: number | null;
  name: string | null;
  file: string | null;
  created: Date | null;
  created_by: number;
  status: number;
  remarks: string | null;
  download_file: number;
}

interface CrmVendorDocumentsCreationAttributes extends Optional<CrmVendorDocumentsAttributes, 'batch_id' | 'doc_type' | 'doc_uploaded_for' | 'leadId' | 'tab' | 'name' | 'file' | 'created' | 'status' | 'remarks'> {}

class CrmVendorDocuments extends Model<CrmVendorDocumentsAttributes, CrmVendorDocumentsCreationAttributes> implements CrmVendorDocumentsAttributes {
  declare id: number;
  declare batch_id: number | null;
  declare doc_type: string | null;
  declare doc_uploaded_for: string | null;
  declare leadId: number | null;
  declare tab: number | null;
  declare name: string | null;
  declare file: string | null;
  declare created: Date | null;
  declare created_by: number;
  declare status: number;
  declare remarks: string | null;
  declare download_file: number;

  public static associate(models: any) {
  }
}

CrmVendorDocuments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    doc_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    doc_uploaded_for: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    tab: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    file: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    created: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    download_file: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmVendorDocuments',
    tableName: 'crm_vendor_documents',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmVendorDocuments };
export type { CrmVendorDocumentsAttributes, CrmVendorDocumentsCreationAttributes };

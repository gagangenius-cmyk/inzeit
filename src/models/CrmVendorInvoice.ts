import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmVendorInvoiceAttributes {
  id: number;
  vendor_id: number;
  batch_id: number;
  ag_no: string;
  invoice: number;
  created: number;
  created_by: number;
}

interface CrmVendorInvoiceCreationAttributes extends Optional<CrmVendorInvoiceAttributes, never> {}

class CrmVendorInvoice extends Model<CrmVendorInvoiceAttributes, CrmVendorInvoiceCreationAttributes> implements CrmVendorInvoiceAttributes {
  declare id: number;
  declare vendor_id: number;
  declare batch_id: number;
  declare ag_no: string;
  declare invoice: number;
  declare created: number;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmVendorInvoice.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ag_no: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    invoice: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmVendorInvoice',
    tableName: 'crm_vendor_invoice',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmVendorInvoice };
export type { CrmVendorInvoiceAttributes, CrmVendorInvoiceCreationAttributes };

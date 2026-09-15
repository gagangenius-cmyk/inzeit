import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmB2bInvoicesAttributes {
  id: number;
  region: number | null;
  receipt: string;
  branch: number | null;
  company: string | null;
  purpose: string | null;
  narration: string | null;
  vat: number | null;
  taxAmt: number | null;
  totPayAmt: number | null;
  payBalance: number;
  payment_mode: string | null;
  amount: number | null;
  discount: number | null;
  status: number | null;
  created: Date | null;
  Counsilor: number | null;
  created_by: number | null;
}

interface CrmB2bInvoicesCreationAttributes extends Optional<CrmB2bInvoicesAttributes, 'region' | 'branch' | 'company' | 'purpose' | 'narration' | 'vat' | 'taxAmt' | 'totPayAmt' | 'payment_mode' | 'amount' | 'discount' | 'status' | 'created' | 'Counsilor' | 'created_by'> {}

class CrmB2bInvoices extends Model<CrmB2bInvoicesAttributes, CrmB2bInvoicesCreationAttributes> implements CrmB2bInvoicesAttributes {
  declare id: number;
  declare region: number | null;
  declare receipt: string;
  declare branch: number | null;
  declare company: string | null;
  declare purpose: string | null;
  declare narration: string | null;
  declare vat: number | null;
  declare taxAmt: number | null;
  declare totPayAmt: number | null;
  declare payBalance: number;
  declare payment_mode: string | null;
  declare amount: number | null;
  declare discount: number | null;
  declare status: number | null;
  declare created: Date | null;
  declare Counsilor: number | null;
  declare created_by: number | null;

  public static associate(models: any) {
  }
}

CrmB2bInvoices.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    receipt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    company: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    purpose: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    narration: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    vat: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    taxAmt: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totPayAmt: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    payBalance: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    discount: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created: {
      type: DataTypes.DATE,
      allowNull: true
    },
    Counsilor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmB2bInvoices',
    tableName: 'crm_b2b_invoices',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmB2bInvoices };
export type { CrmB2bInvoicesAttributes, CrmB2bInvoicesCreationAttributes };

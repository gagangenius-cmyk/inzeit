import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmPayHistoryAttributes {
  id: number;
  leadId: number;
  amount: number;
  counselor_receipt: string;
  tabby: number;
  date: Date | null;
  payMethod: string | null;
  payoption: string;
  paycardoption: string;
  payNextDate: Date;
  payBalance: number;
  tax: number;
  payCategory: string | null;
  payment_remarks: string;
  status: number;
  remark: string | null;
  canDate: Date | null;
  thirdPartyAmt: number;
  dmAmt: number;
  dmTax: number;
  dmRefundAmt: number;
  curValue: number;
  refNumber: string;
  created_by: number;
  stage: string;
  totaltillnow: number;
  proof_url: string | null;
  admin_fee_included: number;
  admin_fee_amount: number;
}

interface CrmPayHistoryCreationAttributes extends Optional<CrmPayHistoryAttributes, 'amount' | 'date' | 'payMethod' | 'tax' | 'payCategory' | 'status' | 'remark' | 'canDate' | 'proof_url' | 'admin_fee_included' | 'admin_fee_amount'> {}

class CrmPayHistory extends Model<CrmPayHistoryAttributes, CrmPayHistoryCreationAttributes> implements CrmPayHistoryAttributes {
  declare id: number;
  declare leadId: number;
  declare amount: number;
  declare counselor_receipt: string;
  declare tabby: number;
  declare date: Date | null;
  declare payMethod: string | null;
  declare payoption: string;
  declare paycardoption: string;
  declare payNextDate: Date;
  declare payBalance: number;
  declare tax: number;
  declare payCategory: string | null;
  declare payment_remarks: string;
  declare status: number;
  declare remark: string | null;
  declare canDate: Date | null;
  declare thirdPartyAmt: number;
  declare dmAmt: number;
  declare dmTax: number;
  declare dmRefundAmt: number;
  declare curValue: number;
  declare refNumber: string;
  declare created_by: number;
  declare stage: string;
  declare totaltillnow: number;
  declare proof_url: string | null;
  declare admin_fee_included: number;
  declare admin_fee_amount: number;

  public static associate(models: any) {
    CrmPayHistory.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmPayHistory.init(
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
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    counselor_receipt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    tabby: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    payMethod: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    payoption: {
      type: DataTypes.STRING(25),
      allowNull: false
    },
    paycardoption: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    payNextDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    payBalance: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    payCategory: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    canDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    thirdPartyAmt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    dmAmt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    dmTax: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    dmRefundAmt: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    curValue: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    refNumber: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    totaltillnow: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    proof_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    admin_fee_included: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    admin_fee_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
  },
  {
    sequelize,
    modelName: 'CrmPayHistory',
    tableName: 'crm_pay_history',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmPayHistory };
export type { CrmPayHistoryAttributes, CrmPayHistoryCreationAttributes };

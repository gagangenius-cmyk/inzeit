import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface Crm3partyPaymentAttributes {
  id: number;
  leadId: number;
  date: Date | null;
  currency_id: number;
  amount: number;
  Tax: number;
  payMethod: string | null;
  emp_id: number;
  receipt_date: Date;
  cc_number: string;
  receipt: string;
  counselor_receipt: string;
  trans_or_ref_number: string;
  remarks: string;
  payoption: string;
  paycardoption: string;
}

type Crm3partyPaymentCreationAttributes = Optional<Crm3partyPaymentAttributes, 'id' | 'date' | 'amount' | 'Tax' | 'payMethod' | 'emp_id'>;

class Crm3partyPayment extends Model<Crm3partyPaymentAttributes, Crm3partyPaymentCreationAttributes> implements Crm3partyPaymentAttributes {
  declare id: number;
  declare leadId: number;
  declare date: Date | null;
  declare currency_id: number;
  declare amount: number;
  declare Tax: number;
  declare payMethod: string | null;
  declare emp_id: number;
  declare receipt_date: Date;
  declare cc_number: string;
  declare receipt: string;
  declare counselor_receipt: string;
  declare trans_or_ref_number: string;
  declare remarks: string;
  declare payoption: string;
  declare paycardoption: string;

  public static associate(models: any) {
    Crm3partyPayment.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
    Crm3partyPayment.hasMany(models.Crm3partyPaymentDet, { foreignKey: 'payId', sourceKey: 'id', as: 'dm3partyPaymentDets' });
  }
}

Crm3partyPayment.init(
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
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    currency_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    Tax: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    payMethod: {
      type: DataTypes.STRING(55),
      allowNull: true
    },
    emp_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    receipt_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cc_number: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    receipt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    counselor_receipt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    trans_or_ref_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    payoption: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    paycardoption: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'Crm3partyPayment',
    tableName: 'crm_3party_payment',
    timestamps: false,
    freezeTableName: true,
  });

export { Crm3partyPayment };
export type { Crm3partyPaymentAttributes, Crm3partyPaymentCreationAttributes };

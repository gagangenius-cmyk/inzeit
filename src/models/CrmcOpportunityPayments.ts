import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcOpportunityPaymentsAttributes {
  id: number;
  opportunityId: number;
  paymentNumber: string;
  receiptNumber: string | null;
  paymentStructure: 'full' | 'installment' | 'milestone';
  paymentType: string | null;
  totalAmount: number;
  amount: number | null;
  paidAmount: number;
  remainingBalance: number;
  balanceAmount: number | null;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  paymentDate: Date;
  status: 'pending' | 'processing' | 'completed' | 'paid' | 'failed' | 'refunded';
  dueDate: Date;
  installmentNumber: number | null;
  totalInstallments: number | null;
  milestoneName: string | null;
  gateway: string;
  gatewayTransactionId: string | null;
  receiptUrl: string | null;
  description: string | null;
  receiptType: string | null;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  clientAddress: string | null;
  serviceName: string | null;
  branchName: string | null;
  consultantName: string | null;
  taxAmount: number | null;
  discountAmount: number | null;
  notes: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  accountantStatus: string | null;
  accountantRemarks: string | null;
  accountantId: number | null;
  accountantVerifiedAt: Date | null;
}

interface CrmcOpportunityPaymentsCreationAttributes extends Optional<CrmcOpportunityPaymentsAttributes, 'id' | 'receiptNumber' | 'paymentType' | 'amount' | 'balanceAmount' | 'transactionId' | 'installmentNumber' | 'totalInstallments' | 'milestoneName' | 'gateway' | 'gatewayTransactionId' | 'receiptUrl' | 'description' | 'receiptType' | 'clientName' | 'clientEmail' | 'clientPhone' | 'clientAddress' | 'serviceName' | 'branchName' | 'consultantName' | 'taxAmount' | 'discountAmount' | 'notes' | 'accountantStatus' | 'accountantRemarks' | 'accountantId' | 'accountantVerifiedAt'> {}

class CrmcOpportunityPayments extends Model<CrmcOpportunityPaymentsAttributes, CrmcOpportunityPaymentsCreationAttributes> implements CrmcOpportunityPaymentsAttributes {
  declare id: number;
  declare opportunityId: number;
  declare paymentNumber: string;
  declare receiptNumber: string | null;
  declare paymentStructure: 'full' | 'installment' | 'milestone';
  declare paymentType: string | null;
  declare totalAmount: number;
  declare amount: number | null;
  declare paidAmount: number;
  declare remainingBalance: number;
  declare balanceAmount: number | null;
  declare currency: string;
  declare paymentMethod: string;
  declare transactionId: string;
  declare paymentDate: Date;
  declare status: 'pending' | 'processing' | 'completed' | 'paid' | 'failed' | 'refunded';
  declare dueDate: Date;
  declare installmentNumber: number | null;
  declare totalInstallments: number | null;
  declare milestoneName: string | null;
  declare gateway: string;
  declare gatewayTransactionId: string | null;
  declare receiptUrl: string | null;
  declare description: string | null;
  declare receiptType: string | null;
  declare clientName: string | null;
  declare clientEmail: string | null;
  declare clientPhone: string | null;
  declare clientAddress: string | null;
  declare serviceName: string | null;
  declare branchName: string | null;
  declare consultantName: string | null;
  declare taxAmount: number | null;
  declare discountAmount: number | null;
  declare notes: string;
  declare createdBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare accountantStatus: string | null;
  declare accountantRemarks: string | null;
  declare accountantId: number | null;
  declare accountantVerifiedAt: Date | null;

  public static associate(models: any) {
    CrmcOpportunityPayments.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'dmcOpportunity' });
    CrmcOpportunityPayments.belongsTo(models.CrmEmployee, { foreignKey: 'createdBy', targetKey: 'id', as: 'createdEmployee' });
  }
}

CrmcOpportunityPayments.init(
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
    paymentNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    receiptNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    paymentStructure: {
      type: DataTypes.ENUM('full', 'installment', 'milestone'),
      allowNull: false,
      defaultValue: 'full'
    },
    paymentType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    paidAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD'
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    dueDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    installmentNumber: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totalInstallments: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    milestoneName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    gateway: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    gatewayTransactionId: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    receiptUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receiptType: {
      type: DataTypes.STRING(50),
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
    clientAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    serviceName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    branchName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    consultantName: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    taxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    discountAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    },
    accountantStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'pending'
    },
    accountantRemarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    accountantId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    accountantVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmcOpportunityPayments',
    tableName: 'crm_opportunity_payments',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcOpportunityPayments };
export type { CrmcOpportunityPaymentsAttributes, CrmcOpportunityPaymentsCreationAttributes };

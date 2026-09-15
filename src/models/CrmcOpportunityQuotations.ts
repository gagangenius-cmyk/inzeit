import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcOpportunityQuotationsAttributes {
  id: number;
  opportunityId: number;
  quotationNumber: string;
  version: number;
  validUntil: Date;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  terms: string;
  notes: string;
  sentDate: Date | null;
  acceptedDate: Date | null;
  rejectedDate: Date | null;
  rejectedReason: string | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmcOpportunityQuotationsCreationAttributes extends Optional<CrmcOpportunityQuotationsAttributes, 'id' | 'sentDate' | 'acceptedDate' | 'rejectedDate' | 'rejectedReason'> {}

class CrmcOpportunityQuotations extends Model<CrmcOpportunityQuotationsAttributes, CrmcOpportunityQuotationsCreationAttributes> implements CrmcOpportunityQuotationsAttributes {
  declare id: number;
  declare opportunityId: number;
  declare quotationNumber: string;
  declare version: number;
  declare validUntil: Date;
  declare status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  declare subtotal: number;
  declare discount: number;
  declare discountType: 'percentage' | 'fixed';
  declare tax: number;
  declare taxRate: number;
  declare total: number;
  declare currency: string;
  declare terms: string;
  declare notes: string;
  declare sentDate: Date | null;
  declare acceptedDate: Date | null;
  declare rejectedDate: Date | null;
  declare rejectedReason: string | null;
  declare createdBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmcOpportunityQuotations.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'dmcOpportunity' });
    CrmcOpportunityQuotations.belongsTo(models.CrmEmployee, { foreignKey: 'createdBy', targetKey: 'id', as: 'createdEmployee' });
    CrmcOpportunityQuotations.hasMany(models.CrmcQuotationItems, { foreignKey: 'quotationId', sourceKey: 'id', as: 'quotationItems' });
  }
}

CrmcOpportunityQuotations.init(
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
    quotationNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'draft'
    },
    subtotal: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    discount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage'
    },
    tax: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    taxRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
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
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sentDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    acceptedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectedReason: {
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
    }
  },
  {
    sequelize,
    modelName: 'CrmcOpportunityQuotations',
    tableName: 'crm_opportunity_quotations',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcOpportunityQuotations };
export type { CrmcOpportunityQuotationsAttributes, CrmcOpportunityQuotationsCreationAttributes };

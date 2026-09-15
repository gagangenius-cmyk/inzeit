import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcQuotationItemsAttributes {
  id: number;
  quotationId: number;
  itemType: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: string;
  category: string;
  serviceType: string;
  duration: string;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmcQuotationItemsCreationAttributes extends Optional<CrmcQuotationItemsAttributes, 'id'> {}

class CrmcQuotationItems extends Model<CrmcQuotationItemsAttributes, CrmcQuotationItemsCreationAttributes> implements CrmcQuotationItemsAttributes {
  declare id: number;
  declare quotationId: number;
  declare itemType: string;
  declare description: string;
  declare quantity: number;
  declare unitPrice: number;
  declare totalPrice: number;
  declare currency: string;
  declare category: string;
  declare serviceType: string;
  declare duration: string;
  declare notes: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmcQuotationItems.belongsTo(models.CrmcOpportunityQuotations, { foreignKey: 'quotationId', targetKey: 'id', as: 'dmcOpportunityQuotation' });
  }
}

CrmcQuotationItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    quotationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_opportunity_quotations',
        key: 'id'
      }
    },
    itemType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1
    },
    unitPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    totalPrice: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'USD'
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    serviceType: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    duration: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'CrmcQuotationItems',
    tableName: 'crm_quotation_items',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcQuotationItems };
export type { CrmcQuotationItemsAttributes, CrmcQuotationItemsCreationAttributes };

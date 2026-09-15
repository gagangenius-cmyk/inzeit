import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsFeeAttributes {
  id: number;
  lead: number;
  amount: number;
  taxAmt: number;
  payDate: Date;
  paidAmt: number;
  paidDate: Date;
  profAmt: number;
  status: number;
}

type CrmcForumLeadsFeeCreationAttributes = Optional<CrmcForumLeadsFeeAttributes, 'id' | 'status'>;

class CrmcForumLeadsFee extends Model<CrmcForumLeadsFeeAttributes, CrmcForumLeadsFeeCreationAttributes> implements CrmcForumLeadsFeeAttributes {
  declare id: number;
  declare lead: number;
  declare amount: number;
  declare taxAmt: number;
  declare payDate: Date;
  declare paidAmt: number;
  declare paidDate: Date;
  declare profAmt: number;
  declare status: number;

  public static associate(models: any) {
    CrmcForumLeadsFee.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmcForumLeadsFee.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    lead: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    taxAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    payDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    paidAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    paidDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    profAmt: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsFee',
    tableName: 'crm_forum_leads_fee',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsFee };
export type { CrmcForumLeadsFeeAttributes, CrmcForumLeadsFeeCreationAttributes };

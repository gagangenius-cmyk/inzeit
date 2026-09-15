import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmRefundsAttributes {
  id: number;
  leadId: number;
  refund_amount: number;
  refund_file: string;
  refund_approved_by: number;
  refund_date: Date;
  refund_department: number;
  revenue_adjust: number;
  revenue_deduct: number;
  refund_approved_date: Date;
  refund_remarks: string;
  refund_type: string;
  created: Date;
  created_by: number;
}

interface CrmRefundsCreationAttributes extends Optional<CrmRefundsAttributes, never> {}

class CrmRefunds extends Model<CrmRefundsAttributes, CrmRefundsCreationAttributes> implements CrmRefundsAttributes {
  declare id: number;
  declare leadId: number;
  declare refund_amount: number;
  declare refund_file: string;
  declare refund_approved_by: number;
  declare refund_date: Date;
  declare refund_department: number;
  declare revenue_adjust: number;
  declare revenue_deduct: number;
  declare refund_approved_date: Date;
  declare refund_remarks: string;
  declare refund_type: string;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmRefunds.init(
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
    refund_amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    refund_file: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    refund_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    refund_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    refund_department: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    revenue_adjust: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    revenue_deduct: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    refund_approved_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    refund_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    refund_type: {
      type: DataTypes.STRING(100),
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
  },
  {
    sequelize,
    modelName: 'CrmRefunds',
    tableName: 'crm_refunds',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmRefunds };
export type { CrmRefundsAttributes, CrmRefundsCreationAttributes };

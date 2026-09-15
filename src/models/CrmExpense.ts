import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmExpenseAttributes {
  id: number;
  date: Date;
  particular: string;
  amount: number;
  vat: number;
  addBy: number;
  remark: string;
  region: number;
  branch: number;
  receipt: string;
  is_approval: number;
  mgmt_approval: number;
  expense_type: number;
  transaction_type: string;
  coa_account_id: number | null;
}

interface CrmExpenseCreationAttributes extends Optional<CrmExpenseAttributes, 'coa_account_id'> {}

class CrmExpense extends Model<CrmExpenseAttributes, CrmExpenseCreationAttributes> implements CrmExpenseAttributes {
  declare id: number;
  declare date: Date;
  declare particular: string;
  declare amount: number;
  declare vat: number;
  declare addBy: number;
  declare remark: string;
  declare region: number;
  declare branch: number;
  declare receipt: string;
  declare is_approval: number;
  declare mgmt_approval: number;
  declare expense_type: number;
  declare transaction_type: string;
  declare coa_account_id: number | null;

  public static associate(models: any) {
    CrmExpense.belongsTo(models.CrmCoaAccount, { foreignKey: 'coa_account_id', targetKey: 'id', as: 'coaAccount' });
  }
}

CrmExpense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    particular: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    vat: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    addBy: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    receipt: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_approval: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mgmt_approval: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    expense_type: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    coa_account_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmExpense',
    tableName: 'crm_expense',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmExpense };
export type { CrmExpenseAttributes, CrmExpenseCreationAttributes };

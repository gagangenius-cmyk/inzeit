import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmAccountsAttributes {
  id: number;
  account_no: string | null;
  bank_address: string | null;
  bank_beneficiary: string | null;
  bank_name: string | null;
  iban: string | null;
  branch_id: string | null;
}

interface CrmAccountsCreationAttributes extends Optional<CrmAccountsAttributes, 'account_no' | 'bank_address' | 'bank_beneficiary' | 'bank_name' | 'iban' | 'branch_id'> {}

class CrmAccounts extends Model<CrmAccountsAttributes, CrmAccountsCreationAttributes> implements CrmAccountsAttributes {
  declare id: number;
  declare account_no: string | null;
  declare bank_address: string | null;
  declare bank_beneficiary: string | null;
  declare bank_name: string | null;
  declare iban: string | null;
  declare branch_id: string | null;

  public static associate(models: any) {
  }
}

CrmAccounts.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    account_no: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_address: {
      type: DataTypes.STRING(1024),
      allowNull: true
    },
    bank_beneficiary: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    iban: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    branch_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmAccounts',
    tableName: 'crm_accounts',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmAccounts };
export type { CrmAccountsAttributes, CrmAccountsCreationAttributes };

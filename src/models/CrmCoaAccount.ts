import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmCoaAccountAttributes {
  id: number;
  code: string;
  name: string;
  group_name: string;
  nature: 'DR' | 'CR';
  status: number;
  created_at: Date;
  updated_at: Date;
}

interface CrmCoaAccountCreationAttributes extends Optional<CrmCoaAccountAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> {}

class CrmCoaAccount extends Model<CrmCoaAccountAttributes, CrmCoaAccountCreationAttributes> implements CrmCoaAccountAttributes {
  declare id: number;
  declare code: string;
  declare name: string;
  declare group_name: string;
  declare nature: 'DR' | 'CR';
  declare status: number;
  declare created_at: Date;
  declare updated_at: Date;

  public static associate(models: any) {
    CrmCoaAccount.hasMany(models.CrmExpense, { foreignKey: 'coa_account_id', sourceKey: 'id', as: 'expenses' });
  }
}

CrmCoaAccount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    group_name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    nature: {
      type: DataTypes.ENUM('DR', 'CR'),
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
  },
  {
    sequelize,
    modelName: 'CrmCoaAccount',
    tableName: 'crm_coa_accounts',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmCoaAccount };
export type { CrmCoaAccountAttributes, CrmCoaAccountCreationAttributes };

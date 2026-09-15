import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmVendorsAttributes {
  id: number;
  name: string;
  status: number;
  created_by: number;
  created: Date;
}

interface CrmVendorsCreationAttributes extends Optional<CrmVendorsAttributes, 'status'> {}

class CrmVendors extends Model<CrmVendorsAttributes, CrmVendorsCreationAttributes> implements CrmVendorsAttributes {
  declare id: number;
  declare name: string;
  declare status: number;
  declare created_by: number;
  declare created: Date;

  public static associate(models: any) {
  }
}

CrmVendors.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmVendors',
    tableName: 'crm_vendors',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmVendors };
export type { CrmVendorsAttributes, CrmVendorsCreationAttributes };

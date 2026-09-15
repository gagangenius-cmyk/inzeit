import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmContractFileAttributes {
  id: number;
  country: number;
  service: number;
  file: string;
  status: number;
}

interface CrmContractFileCreationAttributes extends Optional<CrmContractFileAttributes, 'status'> {}

class CrmContractFile extends Model<CrmContractFileAttributes, CrmContractFileCreationAttributes> implements CrmContractFileAttributes {
  declare id: number;
  declare country: number;
  declare service: number;
  declare file: string;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmContractFile.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    country: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    service: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
  },
  {
    sequelize,
    modelName: 'CrmContractFile',
    tableName: 'crm_contract_file',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmContractFile };
export type { CrmContractFileAttributes, CrmContractFileCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmBatchAttributes {
  id: number;
  batch_name: string;
  batch_number: string;
  created_by: number;
  created: Date;
  vendor_id: number;
  status: number;
}

interface CrmBatchCreationAttributes extends Optional<CrmBatchAttributes, never> {}

class CrmBatch extends Model<CrmBatchAttributes, CrmBatchCreationAttributes> implements CrmBatchAttributes {
  declare id: number;
  declare batch_name: string;
  declare batch_number: string;
  declare created_by: number;
  declare created: Date;
  declare vendor_id: number;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmBatch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    batch_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    batch_number: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmBatch',
    tableName: 'crm_batch',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmBatch };
export type { CrmBatchAttributes, CrmBatchCreationAttributes };

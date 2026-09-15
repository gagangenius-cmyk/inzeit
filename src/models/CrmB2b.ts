import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmB2bAttributes {
  id: number;
  name: string;
  status: number;
  created: Date;
  created_by: number;
}

interface CrmB2bCreationAttributes extends Optional<CrmB2bAttributes, never> {}

class CrmB2b extends Model<CrmB2bAttributes, CrmB2bCreationAttributes> implements CrmB2bAttributes {
  declare id: number;
  declare name: string;
  declare status: number;
  declare created: Date;
  declare created_by: number;

  public static associate(models: any) {
  }
}

CrmB2b.init(
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
    modelName: 'CrmB2b',
    tableName: 'crm_b2b',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmB2b };
export type { CrmB2bAttributes, CrmB2bCreationAttributes };

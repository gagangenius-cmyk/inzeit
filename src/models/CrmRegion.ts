import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmRegionAttributes {
  id: number;
  name: string;
  status: number;
}

interface CrmRegionCreationAttributes extends Optional<CrmRegionAttributes, 'status'> {}

class CrmRegion extends Model<CrmRegionAttributes, CrmRegionCreationAttributes> implements CrmRegionAttributes {
  declare id: number;
  declare name: string;
  declare status: number;

  public static associate(models: any) {
  }
}

CrmRegion.init(
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
  },
  {
    sequelize,
    modelName: 'CrmRegion',
    tableName: 'crm_region',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmRegion };
export type { CrmRegionAttributes, CrmRegionCreationAttributes };

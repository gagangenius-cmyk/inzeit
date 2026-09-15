import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface IeltsAttributes {
  id: number;
  timing: string | null;
  link: string | null;
}

interface IeltsCreationAttributes extends Optional<IeltsAttributes, 'timing' | 'link'> {}

class Ielts extends Model<IeltsAttributes, IeltsCreationAttributes> implements IeltsAttributes {
  declare id: number;
  declare timing: string | null;
  declare link: string | null;

  public static associate(models: any) {
  }
}

Ielts.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    timing: {
      type: DataTypes.STRING(250),
      allowNull: true
    },
    link: {
      type: DataTypes.TEXT,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'Ielts',
    tableName: 'ielts',
    timestamps: false,
    freezeTableName: true,
  });

export { Ielts };
export type { IeltsAttributes, IeltsCreationAttributes };

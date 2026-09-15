import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface GaryWorkDocsAttributes {
  id: number;
  ag_no: number | null;
  docs: string | null;
}

interface GaryWorkDocsCreationAttributes extends Optional<GaryWorkDocsAttributes, 'ag_no' | 'docs'> {}

class GaryWorkDocs extends Model<GaryWorkDocsAttributes, GaryWorkDocsCreationAttributes> implements GaryWorkDocsAttributes {
  declare id: number;
  declare ag_no: number | null;
  declare docs: string | null;

  public static associate(models: any) {
    GaryWorkDocs.belongsTo(models.CrmcForumLeadsContracts, { foreignKey: 'ag_no', targetKey: 'id', as: 'dmcForumLeadsContracts' });
  }
}

GaryWorkDocs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    ag_no: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    docs: {
      type: DataTypes.STRING(70),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'GaryWorkDocs',
    tableName: 'gary_work_docs',
    timestamps: false,
    freezeTableName: true,
  });

export { GaryWorkDocs };
export type { GaryWorkDocsAttributes, GaryWorkDocsCreationAttributes };

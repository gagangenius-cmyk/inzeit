import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmProspectDocumentsAttributes {
  id: number;
  prospectId: number;
  name: string;
  uploadDate: Date;
  url: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmProspectDocumentsCreationAttributes extends Optional<CrmProspectDocumentsAttributes, 'id' | 'uploadDate' | 'type' | 'createdAt' | 'updatedAt'> {}

class CrmProspectDocuments extends Model<CrmProspectDocumentsAttributes, CrmProspectDocumentsCreationAttributes> implements CrmProspectDocumentsAttributes {
  declare id: number;
  declare prospectId: number;
  declare name: string;
  declare uploadDate: Date;
  declare url: string;
  declare type: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmProspectDocuments.belongsTo(models.CrmProspects, { foreignKey: 'prospectId', targetKey: 'id', as: 'prospect' });
  }
}

CrmProspectDocuments.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    prospectId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    uploadDate: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    url: { type: DataTypes.STRING(500), allowNull: false },
    type: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'document' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmProspectDocuments',
    tableName: 'crm_prospect_documents',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmProspectDocuments };
export type { CrmProspectDocumentsAttributes, CrmProspectDocumentsCreationAttributes };

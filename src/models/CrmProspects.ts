import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmProspectsAttributes {
  id: number;
  agreementNumber: string;
  date: Date;
  oldNew: string;
  noc: string;
  counselorId: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmProspectsCreationAttributes extends Optional<CrmProspectsAttributes, 'id' | 'date' | 'oldNew' | 'status' | 'createdAt' | 'updatedAt'> {}

class CrmProspects extends Model<CrmProspectsAttributes, CrmProspectsCreationAttributes> implements CrmProspectsAttributes {
  declare id: number;
  declare agreementNumber: string;
  declare date: Date;
  declare oldNew: string;
  declare noc: string;
  declare counselorId: number;
  declare status: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmProspects.belongsTo(models.CrmEmployee, { foreignKey: 'counselorId', targetKey: 'id', as: 'counselor' });
    CrmProspects.hasMany(models.CrmProspectDocuments, { foreignKey: 'prospectId', sourceKey: 'id', as: 'documents' });
    CrmProspects.hasMany(models.CrmProspectRemarks, { foreignKey: 'prospectId', sourceKey: 'id', as: 'remarks' });
  }
}

CrmProspects.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    agreementNumber: { type: DataTypes.STRING(100), allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    oldNew: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new' },
    noc: { type: DataTypes.STRING(255), allowNull: false },
    counselorId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pending' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmProspects',
    tableName: 'crm_prospects',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmProspects };
export type { CrmProspectsAttributes, CrmProspectsCreationAttributes };

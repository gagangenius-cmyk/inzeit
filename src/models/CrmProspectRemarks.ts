import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmProspectRemarksAttributes {
  id: number;
  prospectId: number;
  date: Date;
  remark: string;
  employeeId: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmProspectRemarksCreationAttributes extends Optional<CrmProspectRemarksAttributes, 'id' | 'date' | 'createdAt' | 'updatedAt'> {}

class CrmProspectRemarks extends Model<CrmProspectRemarksAttributes, CrmProspectRemarksCreationAttributes> implements CrmProspectRemarksAttributes {
  declare id: number;
  declare prospectId: number;
  declare date: Date;
  declare remark: string;
  declare employeeId: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmProspectRemarks.belongsTo(models.CrmProspects, { foreignKey: 'prospectId', targetKey: 'id', as: 'prospect' });
    CrmProspectRemarks.belongsTo(models.CrmEmployee, { foreignKey: 'employeeId', targetKey: 'id', as: 'employee' });
  }
}

CrmProspectRemarks.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
    prospectId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
    remark: { type: DataTypes.TEXT, allowNull: false },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
  },
  {
    sequelize,
    modelName: 'CrmProspectRemarks',
    tableName: 'crm_prospect_remarks',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmProspectRemarks };
export type { CrmProspectRemarksAttributes, CrmProspectRemarksCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsRemarksAttributes {
  id: number;
  lead: number;
  date: Date | null;
  remark: string | null;
  emp: number;
  created: Date | null;
  status: number;
}

interface CrmcForumLeadsRemarksCreationAttributes extends Optional<CrmcForumLeadsRemarksAttributes, 'date' | 'remark' | 'emp' | 'created'> {}

class CrmcForumLeadsRemarks extends Model<CrmcForumLeadsRemarksAttributes, CrmcForumLeadsRemarksCreationAttributes> implements CrmcForumLeadsRemarksAttributes {
  declare id: number;
  declare lead: number;
  declare date: Date | null;
  declare remark: string | null;
  declare emp: number;
  declare created: Date | null;
  declare status: number;

  public static associate(models: any) {
    CrmcForumLeadsRemarks.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmcForumLeadsRemarks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    lead: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created: {
      type: DataTypes.TIME,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsRemarks',
    tableName: 'crm_forum_leads_remarks',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsRemarks };
export type { CrmcForumLeadsRemarksAttributes, CrmcForumLeadsRemarksCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsAssesmentDesgnAttributes {
  id: number;
  skillId: number;
  leadId: number;
  fromEmpRecMonth: string | null;
  fromEmpRecYear: string | null;
  toEmpRecMonth: string | null;
  toEmpRecYear: string | null;
  empRecName: string | null;
  empRecDesign: string | null;
  empRecType: string | null;
}

interface CrmcForumLeadsAssesmentDesgnCreationAttributes extends Optional<CrmcForumLeadsAssesmentDesgnAttributes, 'fromEmpRecMonth' | 'fromEmpRecYear' | 'toEmpRecMonth' | 'toEmpRecYear' | 'empRecName' | 'empRecDesign' | 'empRecType'> {}

class CrmcForumLeadsAssesmentDesgn extends Model<CrmcForumLeadsAssesmentDesgnAttributes, CrmcForumLeadsAssesmentDesgnCreationAttributes> implements CrmcForumLeadsAssesmentDesgnAttributes {
  declare id: number;
  declare skillId: number;
  declare leadId: number;
  declare fromEmpRecMonth: string | null;
  declare fromEmpRecYear: string | null;
  declare toEmpRecMonth: string | null;
  declare toEmpRecYear: string | null;
  declare empRecName: string | null;
  declare empRecDesign: string | null;
  declare empRecType: string | null;

  public static associate(models: any) {
    CrmcForumLeadsAssesmentDesgn.belongsTo(models.CrmcForumLeadsAssesments, { foreignKey: 'skillId', targetKey: 'Id', as: 'dmcForumLeadsAssesments' });
    CrmcForumLeadsAssesmentDesgn.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmcForumLeadsAssesmentDesgn.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    skillId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    fromEmpRecMonth: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    fromEmpRecYear: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    toEmpRecMonth: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    toEmpRecYear: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    empRecName: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    empRecDesign: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    empRecType: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsAssesmentDesgn',
    tableName: 'crm_forum_leads_assesment_desgn',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsAssesmentDesgn };
export type { CrmcForumLeadsAssesmentDesgnAttributes, CrmcForumLeadsAssesmentDesgnCreationAttributes };

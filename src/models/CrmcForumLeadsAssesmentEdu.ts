import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsAssesmentEduAttributes {
  id: number;
  skillId: number;
  leadId: number;
  fromMonth: string | null;
  fromYear: string | null;
  toMonth: string | null;
  toYear: string | null;
  pSEduName: string | null;
  pSEduCourse: string | null;
  pSEduDegree: string | null;
  pSEduType: string | null;
}

interface CrmcForumLeadsAssesmentEduCreationAttributes extends Optional<CrmcForumLeadsAssesmentEduAttributes, 'fromMonth' | 'fromYear' | 'toMonth' | 'toYear' | 'pSEduName' | 'pSEduCourse' | 'pSEduDegree' | 'pSEduType'> {}

class CrmcForumLeadsAssesmentEdu extends Model<CrmcForumLeadsAssesmentEduAttributes, CrmcForumLeadsAssesmentEduCreationAttributes> implements CrmcForumLeadsAssesmentEduAttributes {
  declare id: number;
  declare skillId: number;
  declare leadId: number;
  declare fromMonth: string | null;
  declare fromYear: string | null;
  declare toMonth: string | null;
  declare toYear: string | null;
  declare pSEduName: string | null;
  declare pSEduCourse: string | null;
  declare pSEduDegree: string | null;
  declare pSEduType: string | null;

  public static associate(models: any) {
    CrmcForumLeadsAssesmentEdu.belongsTo(models.CrmcForumLeadsAssesments, { foreignKey: 'skillId', targetKey: 'Id', as: 'dmcForumLeadsAssesments' });
    CrmcForumLeadsAssesmentEdu.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
  }
}

CrmcForumLeadsAssesmentEdu.init(
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
    fromMonth: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    fromYear: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    toMonth: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    toYear: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    pSEduName: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    pSEduCourse: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    pSEduDegree: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    pSEduType: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsAssesmentEdu',
    tableName: 'crm_forum_leads_assesment_edu',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsAssesmentEdu };
export type { CrmcForumLeadsAssesmentEduAttributes, CrmcForumLeadsAssesmentEduCreationAttributes };

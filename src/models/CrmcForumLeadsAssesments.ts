import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsAssesmentsAttributes {
  Id: number;
  leadId: number;
  Type: string | null;
  cob: string | null;
  phOffice: string | null;
  marStatus: string | null;
  haveChild: string | null;
  noOfChild: string | null;
  spfname: string | null;
  spmname: string | null;
  splname: string | null;
  spgender: string | null;
  spdob: Date | null;
  spcob: string | null;
  spcitizenof: string | null;
  spaddress: string | null;
  spmobile: string | null;
  spphHome: string | null;
  spphOffice: string | null;
  spemail: string | null;
  relName: string | null;
  reRelation: string | null;
  reCountry: string | null;
  reAddress: string | null;
  reStatus: string | null;
  moveAsset: string | null;
  inmoveAsset: string | null;
  interestIn: string | null;
  ownership: string | null;
  document: string | null;
  assesment: string | null;
}

interface CrmcForumLeadsAssesmentsCreationAttributes extends Optional<CrmcForumLeadsAssesmentsAttributes, 'Type' | 'cob' | 'phOffice' | 'marStatus' | 'haveChild' | 'noOfChild' | 'spfname' | 'spmname' | 'splname' | 'spgender' | 'spdob' | 'spcob' | 'spcitizenof' | 'spaddress' | 'spmobile' | 'spphHome' | 'spphOffice' | 'spemail' | 'relName' | 'reRelation' | 'reCountry' | 'reAddress' | 'reStatus' | 'moveAsset' | 'inmoveAsset' | 'interestIn' | 'ownership' | 'document' | 'assesment'> {}

class CrmcForumLeadsAssesments extends Model<CrmcForumLeadsAssesmentsAttributes, CrmcForumLeadsAssesmentsCreationAttributes> implements CrmcForumLeadsAssesmentsAttributes {
  declare Id: number;
  declare leadId: number;
  declare Type: string | null;
  declare cob: string | null;
  declare phOffice: string | null;
  declare marStatus: string | null;
  declare haveChild: string | null;
  declare noOfChild: string | null;
  declare spfname: string | null;
  declare spmname: string | null;
  declare splname: string | null;
  declare spgender: string | null;
  declare spdob: Date | null;
  declare spcob: string | null;
  declare spcitizenof: string | null;
  declare spaddress: string | null;
  declare spmobile: string | null;
  declare spphHome: string | null;
  declare spphOffice: string | null;
  declare spemail: string | null;
  declare relName: string | null;
  declare reRelation: string | null;
  declare reCountry: string | null;
  declare reAddress: string | null;
  declare reStatus: string | null;
  declare moveAsset: string | null;
  declare inmoveAsset: string | null;
  declare interestIn: string | null;
  declare ownership: string | null;
  declare document: string | null;
  declare assesment: string | null;

  public static associate(models: any) {
    CrmcForumLeadsAssesments.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
    CrmcForumLeadsAssesments.hasMany(models.CrmcForumLeadsAssesmentDesgn, { foreignKey: 'skillId', sourceKey: 'Id', as: 'dmcForumLeadsAssesmentDesgns' });
    CrmcForumLeadsAssesments.hasMany(models.CrmcForumLeadsAssesmentEdu, { foreignKey: 'skillId', sourceKey: 'Id', as: 'dmcForumLeadsAssesmentEdus' });
  }
}

CrmcForumLeadsAssesments.init(
  {
    Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    Type: {
      type: DataTypes.STRING(55),
      allowNull: true
    },
    cob: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    phOffice: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    marStatus: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    haveChild: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    noOfChild: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    spfname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spmname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    splname: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spgender: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spdob: {
      type: DataTypes.DATE,
      allowNull: true
    },
    spcob: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spcitizenof: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spaddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    spmobile: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spphHome: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spphOffice: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    spemail: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    relName: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    reRelation: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    reCountry: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    reAddress: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    reStatus: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    moveAsset: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    inmoveAsset: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    interestIn: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    ownership: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    document: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    assesment: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsAssesments',
    tableName: 'crm_forum_leads_assesments',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsAssesments };
export type { CrmcForumLeadsAssesmentsAttributes, CrmcForumLeadsAssesmentsCreationAttributes };

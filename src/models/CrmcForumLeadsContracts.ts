import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmcForumLeadsContractsAttributes {
  id: number;
  leadId: number;
  contract: string;
  unsigned_contract: string;
  new_contract: string | null;
  ar_contract: string;
  garys: string | null;
  verify: number;
  remarks: string | null;
  verify_by: number;
  verify_date: Date | null;
  batch_id: number;
  wp_batch_id: number;
  vendor_id: number;
  employer_id: number;
  old_crm_ag_id: number;
  payment_status: number;
}

interface CrmcForumLeadsContractsCreationAttributes extends Optional<CrmcForumLeadsContractsAttributes, 'new_contract' | 'garys' | 'verify' | 'remarks' | 'verify_by' | 'verify_date'> {}

class CrmcForumLeadsContracts extends Model<CrmcForumLeadsContractsAttributes, CrmcForumLeadsContractsCreationAttributes> implements CrmcForumLeadsContractsAttributes {
  declare id: number;
  declare leadId: number;
  declare contract: string;
  declare unsigned_contract: string;
  declare new_contract: string | null;
  declare ar_contract: string;
  declare garys: string | null;
  declare verify: number;
  declare remarks: string | null;
  declare verify_by: number;
  declare verify_date: Date | null;
  declare batch_id: number;
  declare wp_batch_id: number;
  declare vendor_id: number;
  declare employer_id: number;
  declare old_crm_ag_id: number;
  declare payment_status: number;

  public static associate(models: any) {
    CrmcForumLeadsContracts.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'dmcForumLeads' });
    CrmcForumLeadsContracts.hasMany(models.GaryWorkDocs, { foreignKey: 'ag_no', sourceKey: 'id', as: 'garyWorkDocss' });
  }
}

CrmcForumLeadsContracts.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    contract: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    unsigned_contract: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    new_contract: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    ar_contract: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    garys: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    verify: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verify_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    verify_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    wp_batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    employer_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    old_crm_ag_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    payment_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmcForumLeadsContracts',
    tableName: 'crm_forum_leads_contracts',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmcForumLeadsContracts };
export type { CrmcForumLeadsContractsAttributes, CrmcForumLeadsContractsCreationAttributes };

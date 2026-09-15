import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmBranchAttributes {
  id: number;
  name: string;
  ar_name: string;
  branch: string;
  region: number;
  abbrv: string;
  address: string;
  ar_address: string;
  email: string;
  mobile: string;
  status: number;
  website: string;
  license_number: string | null;
  vat_gst_percent: number | null;
}

interface CrmBranchCreationAttributes extends Optional<CrmBranchAttributes, 'status' | 'license_number' | 'vat_gst_percent'> {}

class CrmBranch extends Model<CrmBranchAttributes, CrmBranchCreationAttributes> implements CrmBranchAttributes {
  declare id: number;
  declare name: string;
  declare ar_name: string;
  declare branch: string;
  declare region: number;
  declare abbrv: string;
  declare address: string;
  declare ar_address: string;
  declare email: string;
  declare mobile: string;
  declare status: number;
  declare website: string;
  declare license_number: string | null;
  declare vat_gst_percent: number | null;

  public static associate(models: any) {
    CrmBranch.hasMany(models.CrmcForumLeads, { foreignKey: 'branch', sourceKey: 'id', as: 'dmcForumLeadss' });
    CrmBranch.hasMany(models.CrmFee, { foreignKey: 'branch', sourceKey: 'id', as: 'dmFees' });
    CrmBranch.hasMany(models.BranchTarget, { foreignKey: 'branch', sourceKey: 'id', as: 'branchTargets' });
    CrmBranch.hasMany(models.CrmOperationAllocations, { foreignKey: 'branch', sourceKey: 'id', as: 'operationAllocations' });
  }
}

CrmBranch.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    ar_name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    branch: {
      type: DataTypes.STRING(75),
      allowNull: false
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    abbrv: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ar_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    vat_gst_percent: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'CrmBranch',
    tableName: 'crm_branch',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmBranch };
export type { CrmBranchAttributes, CrmBranchCreationAttributes };

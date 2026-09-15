import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmWpCasesAttributes {
  id: number;
  vendor_id: number;
  approve: number;
  stage_2_approve: number;
  stage_3_approve: number;
  stage_2_denied: number;
  stage_3_denied: number;
  declined: number;
  ag_no: number;
  amount: number;
  amount_stage_2: number;
  amount_stage_3: number;
  created: Date;
  created_by: number;
  batch_id: number;
  account_approve: number;
  account_approve_two: number;
  account_approve_three: number;
  ops_approve: number;
  ops_approve_two: number;
  ops_approve_three: number;
  stage_2_file: string;
  stage_3_file: string;
  rejection: string;
}

interface CrmWpCasesCreationAttributes extends Optional<CrmWpCasesAttributes, never> {}

class CrmWpCases extends Model<CrmWpCasesAttributes, CrmWpCasesCreationAttributes> implements CrmWpCasesAttributes {
  declare id: number;
  declare vendor_id: number;
  declare approve: number;
  declare stage_2_approve: number;
  declare stage_3_approve: number;
  declare stage_2_denied: number;
  declare stage_3_denied: number;
  declare declined: number;
  declare ag_no: number;
  declare amount: number;
  declare amount_stage_2: number;
  declare amount_stage_3: number;
  declare created: Date;
  declare created_by: number;
  declare batch_id: number;
  declare account_approve: number;
  declare account_approve_two: number;
  declare account_approve_three: number;
  declare ops_approve: number;
  declare ops_approve_two: number;
  declare ops_approve_three: number;
  declare stage_2_file: string;
  declare stage_3_file: string;
  declare rejection: string;

  public static associate(models: any) {
  }
}

CrmWpCases.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    approve: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage_2_approve: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage_3_approve: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage_2_denied: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage_3_denied: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    declined: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ag_no: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    amount_stage_2: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    amount_stage_3: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    batch_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    account_approve: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    account_approve_two: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    account_approve_three: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops_approve: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops_approve_two: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops_approve_three: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    stage_2_file: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    stage_3_file: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    rejection: {
      type: DataTypes.TEXT,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmWpCases',
    tableName: 'crm_wp_cases',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmWpCases };
export type { CrmWpCasesAttributes, CrmWpCasesCreationAttributes };

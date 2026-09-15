import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmEuropeCasesVerificationAttributes {
  id: number;
  lead_id: number;
  passports_for_eu: string;
  os_for_eu: string;
  email: string;
  mobile: string;
  remarks: string;
  ops_status: number;
  ops_approval: number;
  ops_remarks: string;
  ops: number;
  manager: number;
  manager_status: number;
  manager_approval: number;
  manager_remarks: string;
  stage: string;
  created: Date;
  created_by: number;
  approval_date: Date;
  rejection_date: Date;
}

interface CrmEuropeCasesVerificationCreationAttributes extends Optional<CrmEuropeCasesVerificationAttributes, never> {}

class CrmEuropeCasesVerification extends Model<CrmEuropeCasesVerificationAttributes, CrmEuropeCasesVerificationCreationAttributes> implements CrmEuropeCasesVerificationAttributes {
  declare id: number;
  declare lead_id: number;
  declare passports_for_eu: string;
  declare os_for_eu: string;
  declare email: string;
  declare mobile: string;
  declare remarks: string;
  declare ops_status: number;
  declare ops_approval: number;
  declare ops_remarks: string;
  declare ops: number;
  declare manager: number;
  declare manager_status: number;
  declare manager_approval: number;
  declare manager_remarks: string;
  declare stage: string;
  declare created: Date;
  declare created_by: number;
  declare approval_date: Date;
  declare rejection_date: Date;

  public static associate(models: any) {
  }
}

CrmEuropeCasesVerification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passports_for_eu: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    os_for_eu: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    mobile: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ops_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops_approval: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ops_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ops: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    manager: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    manager_status: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    manager_approval: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    manager_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    stage: {
      type: DataTypes.STRING(100),
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
    approval_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    rejection_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmEuropeCasesVerification',
    tableName: 'crm_europe_cases_verification',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmEuropeCasesVerification };
export type { CrmEuropeCasesVerificationAttributes, CrmEuropeCasesVerificationCreationAttributes };

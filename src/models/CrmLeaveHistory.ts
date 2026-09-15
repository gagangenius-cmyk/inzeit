import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmLeaveHistoryAttributes {
  id: number;
  custId: number;
  applyDate: Date;
  fromDate: Date;
  toDate: Date;
  type: string;
  approvBy: string;
  requestedTo: string;
  requested_time_from: Date;
  requested_time_to: Date;
  remark: string;
  status: number;
  file: string;
  reject: string;
  reject_remarks: string;
  notf: number;
  approved_date: Date;
  reject_date: Date;
}

interface CrmLeaveHistoryCreationAttributes extends Optional<CrmLeaveHistoryAttributes, 'status'> {}

class CrmLeaveHistory extends Model<CrmLeaveHistoryAttributes, CrmLeaveHistoryCreationAttributes> implements CrmLeaveHistoryAttributes {
  declare id: number;
  declare custId: number;
  declare applyDate: Date;
  declare fromDate: Date;
  declare toDate: Date;
  declare type: string;
  declare approvBy: string;
  declare requestedTo: string;
  declare requested_time_from: Date;
  declare requested_time_to: Date;
  declare remark: string;
  declare status: number;
  declare file: string;
  declare reject: string;
  declare reject_remarks: string;
  declare notf: number;
  declare approved_date: Date;
  declare reject_date: Date;

  public static associate(models: any) {
  }
}

CrmLeaveHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    custId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    applyDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    fromDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    toDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    approvBy: {
      type: DataTypes.STRING(555),
      allowNull: false
    },
    requestedTo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    requested_time_from: {
      type: DataTypes.TIME,
      allowNull: false
    },
    requested_time_to: {
      type: DataTypes.TIME,
      allowNull: false
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    file: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    reject: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    reject_remarks: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    notf: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    reject_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmLeaveHistory',
    tableName: 'crm_leave_history',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmLeaveHistory };
export type { CrmLeaveHistoryAttributes, CrmLeaveHistoryCreationAttributes };

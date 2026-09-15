import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface AppointmentsAttributes {
  id: number;
  leadid: number | null;
  date: string | null;
  appointtime: string;
  counsilorid: number | null;
  booked: number | null;
  done: number | null;
  not_done: number | null;
  region: number | null;
  branch: number;
  screenshot: string;
  second_done: number;
  second_meet_date: string | null;
  meeting_status: string | null;
  meeting_verified: number | null;
  verified_by: number | null;
  verified_at: Date | null;
  foe_remark: string | null;
  // General remark on the appointment itself, settable by the owning
  // counselor/BM/CEO — distinct from `foe_remark`, which is reserved for the
  // FOE's meeting-verification decision.
  remarks: string | null;
  cross_branch: number;
  assigned_branch: number | null;
  assigned_by: number | null;
  acknowledged: number;
  acknowledged_at: Date | null;
}

interface AppointmentsCreationAttributes extends Optional<AppointmentsAttributes, 'id' | 'leadid' | 'date' | 'counsilorid' | 'booked' | 'done' | 'not_done' | 'region' | 'branch' | 'screenshot' | 'second_done' | 'second_meet_date' | 'meeting_status' | 'meeting_verified' | 'verified_by' | 'verified_at' | 'foe_remark' | 'remarks' | 'cross_branch' | 'assigned_branch' | 'assigned_by' | 'acknowledged' | 'acknowledged_at'> {}

class Appointments extends Model<AppointmentsAttributes, AppointmentsCreationAttributes> implements AppointmentsAttributes {
  declare id: number;
  declare leadid: number | null;
  declare date: string | null;
  declare appointtime: string;
  declare counsilorid: number | null;
  declare booked: number | null;
  declare done: number | null;
  declare not_done: number | null;
  declare region: number | null;
  declare branch: number;
  declare screenshot: string;
  declare second_done: number;
  declare second_meet_date: string | null;
  declare meeting_status: string | null;
  declare meeting_verified: number | null;
  declare verified_by: number | null;
  declare verified_at: Date | null;
  declare foe_remark: string | null;
  declare remarks: string | null;
  declare cross_branch: number;
  declare assigned_branch: number | null;
  declare assigned_by: number | null;
  declare acknowledged: number;
  declare acknowledged_at: Date | null;

  public static associate(models: any) {
    Appointments.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadid', targetKey: 'id', as: 'lead' });
    Appointments.belongsTo(models.CrmEmployee, { foreignKey: 'counsilorid', targetKey: 'id', as: 'counselor' });
    Appointments.belongsTo(models.CrmBranch, { foreignKey: 'branch', targetKey: 'id', as: 'branchInfo' });
    Appointments.belongsTo(models.CrmRegion, { foreignKey: 'region', targetKey: 'id', as: 'regionInfo' });
    Appointments.belongsTo(models.CrmBranch, { foreignKey: 'assigned_branch', targetKey: 'id', as: 'assignedBranchInfo' });
    Appointments.belongsTo(models.CrmEmployee, { foreignKey: 'assigned_by', targetKey: 'id', as: 'assignedByEmployee' });
  }
}

Appointments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    leadid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    appointtime: {
      type: DataTypes.TIME,
      allowNull: false
    },
    counsilorid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    booked: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    done: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    not_done: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    region: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    branch: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    screenshot: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    },
    second_done: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    second_meet_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      defaultValue: null
    },
    meeting_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null
    },
    meeting_verified: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    verified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    verified_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    foe_remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    cross_branch: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    assigned_branch: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    },
    acknowledged: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    acknowledged_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
  },
  {
    sequelize,
    modelName: 'Appointments',
    tableName: 'appointments',
    timestamps: false,
    freezeTableName: true,
  });

export { Appointments };
export type { AppointmentsAttributes, AppointmentsCreationAttributes };

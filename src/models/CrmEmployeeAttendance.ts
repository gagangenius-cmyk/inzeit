import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmEmployeeAttendanceAttributes {
  id: number;
  emp_id: number;
  ip_address: string;
  device: string;
  agent: string;
  login_time: Date;
  logout_time: Date;
  total_hours: number;
  short_fall: number;
  remarks: string;
  watch_by: number;
  created: Date;
  created_by: number;
  checkin: number;
  checkout: number;
  logout_ip_address: string;
  extra_hours: number;
}

interface CrmEmployeeAttendanceCreationAttributes extends Optional<CrmEmployeeAttendanceAttributes, never> {}

class CrmEmployeeAttendance extends Model<CrmEmployeeAttendanceAttributes, CrmEmployeeAttendanceCreationAttributes> implements CrmEmployeeAttendanceAttributes {
  declare id: number;
  declare emp_id: number;
  declare ip_address: string;
  declare device: string;
  declare agent: string;
  declare login_time: Date;
  declare logout_time: Date;
  declare total_hours: number;
  declare short_fall: number;
  declare remarks: string;
  declare watch_by: number;
  declare created: Date;
  declare created_by: number;
  declare checkin: number;
  declare checkout: number;
  declare logout_ip_address: string;
  declare extra_hours: number;

  public static associate(models: any) {
  }
}

CrmEmployeeAttendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    emp_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    device: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    agent: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    login_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    logout_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    // Real column type is DOUBLE(10,2), not DECIMAL(10,2) - verified live
    // against this deployment's actual crm_employee_attendance schema
    // (INFORMATION_SCHEMA.COLUMNS) while investigating the "Unable to
    // update employee presence" bug earlier this session. Sequelize's
    // DECIMAL maps to MySQL's exact fixed-point DECIMAL, a different wire
    // type from DOUBLE.
    total_hours: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false
    },
    short_fall: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false
    },
    // Real column is LONGTEXT, not TEXT (MySQL TEXT caps at 64KB; this
    // deployment's actual column has no such cap) - DataTypes.TEXT defaults
    // to MySQL TEXT; 'long' selects LONGTEXT.
    remarks: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    watch_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Real column is DATE, not DATETIME - DataTypes.DATE maps to MySQL
    // DATETIME; DATEONLY is the one that matches a bare DATE column.
    created: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    checkin: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    checkout: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    logout_ip_address: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    extra_hours: {
      type: DataTypes.DOUBLE(10,2),
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmEmployeeAttendance',
    tableName: 'crm_employee_attendance',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmEmployeeAttendance };
export type { CrmEmployeeAttendanceAttributes, CrmEmployeeAttendanceCreationAttributes };

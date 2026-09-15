import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

export interface CrmcMeetingSchedulesAttributes {
  id: number;
  lead_id: number;
  user_id: number;
  meeting_date: Date;
  meeting_type: string;
  location?: string;
  agenda?: string;
  status: string;
  priority: string;
  notes?: string;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CrmcMeetingSchedulesCreationAttributes extends Optional<CrmcMeetingSchedulesAttributes, 'id' | 'location' | 'agenda' | 'status' | 'priority' | 'notes' | 'completed_at' | 'created_at' | 'updated_at'> {}

export class CrmcMeetingSchedules extends Model<CrmcMeetingSchedulesAttributes, CrmcMeetingSchedulesCreationAttributes> implements CrmcMeetingSchedulesAttributes {
  declare id: number;
  declare lead_id: number;
  declare user_id: number;
  declare meeting_date: Date;
  declare meeting_type: string;
  declare location?: string;
  declare agenda?: string;
  declare status: string;
  declare priority: string;
  declare notes?: string;
  declare completed_at?: Date;
  declare created_at: Date;
  declare updated_at: Date;

  // Associations
  declare dmcForumLead?: any;
  declare dmEmployee?: any;

  public static associate(models: any) {
    CrmcMeetingSchedules.belongsTo(models.CrmcForumLeads, {
      foreignKey: 'lead_id',
      as: 'dmcForumLead'
    });
    
    CrmcMeetingSchedules.belongsTo(models.CrmEmployee, {
      foreignKey: 'user_id',
      as: 'dmEmployee'
    });
  }
}

CrmcMeetingSchedules.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    meeting_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    meeting_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    agenda: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    priority: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'normal',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CrmcMeetingSchedules',
    tableName: 'crm_meeting_schedules',
    timestamps: false,
    freezeTableName: true,
  }
);

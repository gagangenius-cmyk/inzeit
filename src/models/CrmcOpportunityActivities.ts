import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmcOpportunityActivitiesAttributes {
  id: number;
  opportunityId: number;
  activityType: string;
  activityTitle: string;
  description: string;
  activityDate: Date;
  duration: number;
  outcome: string;
  nextStep: string;
  assignedTo: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
  attendees: string;
  notes: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmcOpportunityActivitiesCreationAttributes extends Optional<CrmcOpportunityActivitiesAttributes, 'id'> {}

class CrmcOpportunityActivities extends Model<CrmcOpportunityActivitiesAttributes, CrmcOpportunityActivitiesCreationAttributes> implements CrmcOpportunityActivitiesAttributes {
  declare id: number;
  declare opportunityId: number;
  declare activityType: string;
  declare activityTitle: string;
  declare description: string;
  declare activityDate: Date;
  declare duration: number;
  declare outcome: string;
  declare nextStep: string;
  declare assignedTo: number;
  declare priority: 'low' | 'medium' | 'high' | 'urgent';
  declare status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  declare location: string;
  declare attendees: string;
  declare notes: string;
  declare createdBy: number;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmcOpportunityActivities.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'dmcOpportunity' });
    CrmcOpportunityActivities.belongsTo(models.CrmEmployee, { foreignKey: 'assignedTo', targetKey: 'id', as: 'assignedEmployee' });
    CrmcOpportunityActivities.belongsTo(models.CrmEmployee, { foreignKey: 'createdBy', targetKey: 'id', as: 'createdEmployee' });
  }
}

CrmcOpportunityActivities.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_opportunities',
        key: 'id'
      }
    },
    activityType: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    activityTitle: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activityDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    outcome: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nextStep: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium'
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled'
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    attendees: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'crm_employee',
        key: 'id'
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'CrmcOpportunityActivities',
    tableName: 'crm_opportunity_activities',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    freezeTableName: true,
  }
);

export { CrmcOpportunityActivities };
export type { CrmcOpportunityActivitiesAttributes, CrmcOpportunityActivitiesCreationAttributes };

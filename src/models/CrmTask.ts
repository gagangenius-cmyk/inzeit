import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmTaskAttributes {
  id: number;
  task: string | null;
  dob: Date | null;
  date_created: string | null;
  stage: number;
  asignTo: number;
  asignBy: number;
  status: string;
  doc: string | null;
  notf: number;
  created: Date;
  opportunityId: number | null;
  visaType: string | null;
}

interface CrmTaskCreationAttributes extends Optional<CrmTaskAttributes, 'task' | 'dob' | 'date_created' | 'stage' | 'asignTo' | 'asignBy' | 'status' | 'doc' | 'notf' | 'created' | 'opportunityId' | 'visaType'> {}

class CrmTask extends Model<CrmTaskAttributes, CrmTaskCreationAttributes> implements CrmTaskAttributes {
  declare id: number;
  declare task: string | null;
  declare dob: Date | null;
  declare date_created: string | null;
  declare stage: number;
  declare asignTo: number;
  declare asignBy: number;
  declare status: string;
  declare doc: string | null;
  declare notf: number;
  declare created: Date;
  declare opportunityId: number | null;
  declare visaType: string | null;

  public static associate(models: any) {
    CrmTask.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'opportunity' });
  }
}

CrmTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    task: {
      type: DataTypes.STRING(555),
      allowNull: true
    },
    dob: {
      type: DataTypes.DATE,
      allowNull: true
    },
    date_created: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    stage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    asignTo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    asignBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '0'
    },
    doc: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    notf: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: '\'0000-00-00'
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'opportunity_id',
    },
    visaType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'visa_type',
    },
  },
  {
    sequelize,
    modelName: 'CrmTask',
    tableName: 'crm_task',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmTask };
export type { CrmTaskAttributes, CrmTaskCreationAttributes };

import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface TaskRemarksAttributes {
  id: number;
  taskid: number | null;
  date: string | null;
  remarks: string | null;
  emp: string | null;
  notf: number | null;
}

interface TaskRemarksCreationAttributes extends Optional<TaskRemarksAttributes, 'taskid' | 'date' | 'remarks' | 'emp' | 'notf'> {}

class TaskRemarks extends Model<TaskRemarksAttributes, TaskRemarksCreationAttributes> implements TaskRemarksAttributes {
  declare id: number;
  declare taskid: number | null;
  declare date: string | null;
  declare remarks: string | null;
  declare emp: string | null;
  declare notf: number | null;

  public static associate(models: any) {
  }
}

TaskRemarks.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    taskid: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    emp: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    notf: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'TaskRemarks',
    tableName: 'task_remarks',
    timestamps: false,
    freezeTableName: true,
  });

export { TaskRemarks };
export type { TaskRemarksAttributes, TaskRemarksCreationAttributes };

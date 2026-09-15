import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface StudentLeadsLogsAttributes {
  id: number;
  Counsilor: number | null;
  lead: number | null;
  date: string | null;
}

interface StudentLeadsLogsCreationAttributes extends Optional<StudentLeadsLogsAttributes, 'Counsilor' | 'lead' | 'date'> {}

class StudentLeadsLogs extends Model<StudentLeadsLogsAttributes, StudentLeadsLogsCreationAttributes> implements StudentLeadsLogsAttributes {
  declare id: number;
  declare Counsilor: number | null;
  declare lead: number | null;
  declare date: string | null;

  public static associate(models: any) {
    StudentLeadsLogs.belongsTo(models.CrmEmployee, { foreignKey: 'Counsilor', targetKey: 'id', as: 'dmEmployee' });
  }
}

StudentLeadsLogs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    Counsilor: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lead: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    date: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
  },
  {
    sequelize,
    modelName: 'StudentLeadsLogs',
    tableName: 'student_leads_logs',
    timestamps: false,
    freezeTableName: true,
  });

export { StudentLeadsLogs };
export type { StudentLeadsLogsAttributes, StudentLeadsLogsCreationAttributes };

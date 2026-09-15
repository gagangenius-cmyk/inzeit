import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface CrmClientLogsAttributes {
  id: number;
  client_id: number;
  lead_id: number;
  title: string;
  log: string;
  created: Date;
}

interface CrmClientLogsCreationAttributes extends Optional<CrmClientLogsAttributes, never> {}

class CrmClientLogs extends Model<CrmClientLogsAttributes, CrmClientLogsCreationAttributes> implements CrmClientLogsAttributes {
  declare id: number;
  declare client_id: number;
  declare lead_id: number;
  declare title: string;
  declare log: string;
  declare created: Date;

  public static associate(models: any) {
  }
}

CrmClientLogs.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    log: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'CrmClientLogs',
    tableName: 'crm_client_logs',
    timestamps: false,
    freezeTableName: true,
  });

export { CrmClientLogs };
export type { CrmClientLogsAttributes, CrmClientLogsCreationAttributes };

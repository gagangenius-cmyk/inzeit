import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmOperationStageDataAttributes {
  id: number;
  module: string;
  leadId: number;
  opportunityId: number | null;
  stage: string;
  stageData: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CrmOperationStageDataCreationAttributes extends Optional<CrmOperationStageDataAttributes, 'id' | 'opportunityId' | 'stageData' | 'createdAt' | 'updatedAt'> {}

class CrmOperationStageData extends Model<CrmOperationStageDataAttributes, CrmOperationStageDataCreationAttributes> implements CrmOperationStageDataAttributes {
  declare id: number;
  declare module: string;
  declare leadId: number;
  declare opportunityId: number | null;
  declare stage: string;
  declare stageData: string;
  declare createdAt: Date;
  declare updatedAt: Date;

  public static associate(models: any) {
    CrmOperationStageData.belongsTo(models.CrmcForumLeads, { foreignKey: 'leadId', targetKey: 'id', as: 'lead' });
    CrmOperationStageData.belongsTo(models.CrmcOpportunities, { foreignKey: 'opportunityId', targetKey: 'id', as: 'opportunity' });
  }
}

CrmOperationStageData.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    module: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    leadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    opportunityId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stage: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    stageData: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      defaultValue: '{}',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'CrmOperationStageData',
    tableName: 'crm_operation_stage_data',
    timestamps: true,
    freezeTableName: true,
  }
);

export { CrmOperationStageData };
export type { CrmOperationStageDataAttributes, CrmOperationStageDataCreationAttributes };

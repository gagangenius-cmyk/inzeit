import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';

interface CrmRemarksAttributes {
  id: number;
  leadId: number;
  action: string;
  remark: string;
  previousValue: string | null;
  newValue: string | null;
  actorId: number | null;
  actorRole: string | null;
  createdAt: Date;
}

interface CrmRemarksCreationAttributes extends Optional<CrmRemarksAttributes, 'id' | 'previousValue' | 'newValue' | 'actorId' | 'actorRole' | 'createdAt'> {}

class CrmRemarks extends Model<CrmRemarksAttributes, CrmRemarksCreationAttributes> implements CrmRemarksAttributes {
  declare id: number;
  declare leadId: number;
  declare action: string;
  declare remark: string;
  declare previousValue: string | null;
  declare newValue: string | null;
  declare actorId: number | null;
  declare actorRole: string | null;
  declare createdAt: Date;

  public static associate(models: any) {
    CrmRemarks.belongsTo(models.CrmcForumLeads, { foreignKey: 'lead_id', targetKey: 'id', as: 'lead' });
    CrmRemarks.belongsTo(models.CrmEmployee, { foreignKey: 'actor_id', targetKey: 'id', as: 'actor' });
  }
}

CrmRemarks.init(
  {
    id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, field: 'id' },
    leadId: { type: DataTypes.INTEGER, allowNull: false, field: 'lead_id', references: { model: 'crm_forum_leads', key: 'id' } },
    action: { type: DataTypes.STRING(50), allowNull: false, field: 'action' },
    remark: { type: DataTypes.TEXT, allowNull: false, field: 'remark' },
    previousValue: { type: DataTypes.STRING(255), allowNull: true, field: 'previous_value' },
    newValue: { type: DataTypes.STRING(255), allowNull: true, field: 'new_value' },
    actorId: { type: DataTypes.INTEGER, allowNull: true, field: 'actor_id', references: { model: 'crm_employee', key: 'id' } },
    actorRole: { type: DataTypes.STRING(80), allowNull: true, field: 'actor_role' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' }
  },
  {
    sequelize,
    modelName: 'CrmRemarks',
    tableName: 'crm_remarks',
    timestamps: false,
    freezeTableName: true,
  }
);

export { CrmRemarks };
export type { CrmRemarksAttributes, CrmRemarksCreationAttributes };

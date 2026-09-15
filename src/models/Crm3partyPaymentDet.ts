import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../lib/sequelize';
interface Crm3partyPaymentDetAttributes {
  id: number;
  payId: number;
  particular: string;
  amount: number;
}

interface Crm3partyPaymentDetCreationAttributes extends Optional<Crm3partyPaymentDetAttributes, 'id'> {}

class Crm3partyPaymentDet extends Model<Crm3partyPaymentDetAttributes, Crm3partyPaymentDetCreationAttributes> implements Crm3partyPaymentDetAttributes {
  declare id: number;
  declare payId: number;
  declare particular: string;
  declare amount: number;

  public static associate(models: any) {
    Crm3partyPaymentDet.belongsTo(models.Crm3partyPayment, { foreignKey: 'payId', targetKey: 'id', as: 'dm3partyPayment' });
  }
}

Crm3partyPaymentDet.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    payId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    particular: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false
    },
  },
  {
    sequelize,
    modelName: 'Crm3partyPaymentDet',
    tableName: 'crm_3party_payment_det',
    timestamps: false,
    freezeTableName: true,
  });

export { Crm3partyPaymentDet };
export type { Crm3partyPaymentDetAttributes, Crm3partyPaymentDetCreationAttributes };

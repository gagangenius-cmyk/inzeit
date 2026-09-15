import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import mysql from 'mysql2';

// Load environment variables
dotenv.config();

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'mysql://root:@localhost:3306/dmconsultant_mydmcons_dm',
  {
    dialect: 'mysql',
    dialectModule: mysql,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: false,
      freezeTableName: true,
    },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },
  }
);

// Test the connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully with Sequelize');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };
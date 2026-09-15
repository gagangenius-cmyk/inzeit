import { connectDB } from '../lib/sequelize';
import { Lead } from '../models';

async function testSequelize() {
  try {
    // Connect to database
    await connectDB();

    // Test querying leads
    const leads = await Lead.findAll({
      limit: 5,
      order: [['id', 'ASC']]
    });

    console.log(`✅ Found ${leads.length} leads`);
    console.log('Sample lead:', leads[0]?.toJSON());

    console.log('✅ Sequelize setup successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Sequelize test failed:', error);
    process.exit(1);
  }
}

testSequelize();
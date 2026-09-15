
import { connectDB } from '@/lib/sequelize';
import '@/models'; // This will trigger the association logic in models/index.ts

export const initializeDatabase = async () => {
    try {
        await connectDB();
        console.log('✅ Models initialized and associations set');
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};

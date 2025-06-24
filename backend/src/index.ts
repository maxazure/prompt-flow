import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { app } from './app';

dotenv.config();
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { app };
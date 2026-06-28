import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const connUri = process.env.MONGO_URI || 'mongodb://localhost:2017/linkly';
    console.log(`Connecting to MongoDB at: ${connUri}`);
    
    const conn = await mongoose.connect(connUri);
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

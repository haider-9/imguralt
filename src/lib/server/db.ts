import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://haider:108663@cluster0.sbzs5ys.mongodb.net/imguralt?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

export async function connectDB() {
	if (isConnected) return;

	try {
		await mongoose.connect(MONGODB_URI);
		isConnected = true;
		console.log('MongoDB connected');
	} catch (err) {
		console.error('MongoDB connection error:', err);
		throw err;
	}
}

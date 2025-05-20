import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.send('PDF Management & Collaboration Backend is running.');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

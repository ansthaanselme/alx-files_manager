import express from 'express';
import router from './routes/index';

const port = process.env.PORT || 5000;
const host = process.env.HOST || 'localhost';

const app = express();

app.use(express.json());
app.use(router);
app.listen(port, host);

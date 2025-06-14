import app from '../dist/server.js';
import serverless from 'serverless-http';

export default serverless(app);

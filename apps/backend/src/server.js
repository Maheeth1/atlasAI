const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({
        status: 'running',
        app: 'AtlasAI Backend',
        time: new Date().toISOString()
    });
});

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Backend API is running at http://localhost:${PORT}`);
});
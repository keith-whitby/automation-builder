// API endpoint to serve environment variables
// This works with Vercel's serverless functions

export default function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method === 'GET') {
        // Return environment variables as JSON
        const config = {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
        };
        
        console.log('Config API called, OPENAI_API_KEY:', config.OPENAI_API_KEY ? '***SET***' : 'NOT SET');
        
        res.status(200).json(config);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

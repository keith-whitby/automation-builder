const fs = require('fs');
const path = require('path');

// Read the built index.html file
const indexPath = path.join(__dirname, '../public/index.html');

try {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Replace environment variable placeholders with actual values
    const envVars = {
        '{{OPENAI_API_KEY}}': process.env.OPENAI_API_KEY || ''
    };
    
    // Replace all placeholders
    Object.keys(envVars).forEach(placeholder => {
        content = content.replace(new RegExp(placeholder, 'g'), envVars[placeholder]);
    });
    
    // Write the updated content back
    fs.writeFileSync(indexPath, content, 'utf8');
    
    console.log('Environment variables injected successfully');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***SET***' : 'NOT SET');
    
} catch (error) {
    console.error('Error injecting environment variables:', error);
    process.exit(1);
}

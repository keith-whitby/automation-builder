const fs = require('fs');
const path = require('path');

// Read the built index.html file
const indexPath = path.join(__dirname, '../public/index.html');

try {
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Log all available environment variables for debugging
    console.log('Available environment variables:');
    console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '***SET***' : 'NOT SET');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('VERCEL:', process.env.VERCEL);
    
    // Replace environment variable placeholders with actual values
    const envVars = {
        '{{OPENAI_API_KEY}}': process.env.OPENAI_API_KEY || ''
    };
    
    console.log('Replacing placeholders:', envVars);
    
    // Replace all placeholders
    Object.keys(envVars).forEach(placeholder => {
        const originalContent = content;
        content = content.replace(new RegExp(placeholder, 'g'), envVars[placeholder]);
        if (content !== originalContent) {
            console.log(`Replaced ${placeholder} with:`, envVars[placeholder] ? '***SET***' : 'NOT SET');
        } else {
            console.log(`No instances of ${placeholder} found to replace`);
        }
    });
    
    // Write the updated content back
    fs.writeFileSync(indexPath, content, 'utf8');
    
    console.log('Environment variables injected successfully');
    
} catch (error) {
    console.error('Error injecting environment variables:', error);
    process.exit(1);
}

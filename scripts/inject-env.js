const fs = require('fs');
const path = require('path');

// Read the built index.html file
const indexPath = path.join(__dirname, '../public/index.html');

console.log('Starting environment variable injection...');
console.log('Current working directory:', process.cwd());
console.log('Script directory:', __dirname);
console.log('Target file path:', indexPath);
console.log('File exists:', fs.existsSync(indexPath));

try {
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
    
    // Process index.html
    if (fs.existsSync(indexPath)) {
        let indexContent = fs.readFileSync(indexPath, 'utf8');
        
        Object.keys(envVars).forEach(placeholder => {
            const originalContent = indexContent;
            indexContent = indexContent.replace(new RegExp(placeholder, 'g'), envVars[placeholder]);
            if (indexContent !== originalContent) {
                console.log(`Replaced ${placeholder} in index.html with:`, envVars[placeholder] ? '***SET***' : 'NOT SET');
            } else {
                console.log(`No instances of ${placeholder} found in index.html to replace`);
            }
        });
        
        fs.writeFileSync(indexPath, indexContent, 'utf8');
        console.log('index.html updated successfully');
    } else {
        console.log('index.html not found, skipping...');
    }
    
    // Process env-config.js
    const envConfigPath = path.join(__dirname, '../public/env-config.js');
    if (fs.existsSync(envConfigPath)) {
        let envConfigContent = fs.readFileSync(envConfigPath, 'utf8');
        
        Object.keys(envVars).forEach(placeholder => {
            const originalContent = envConfigContent;
            envConfigContent = envConfigContent.replace(new RegExp(placeholder, 'g'), envVars[placeholder]);
            if (envConfigContent !== originalContent) {
                console.log(`Replaced ${placeholder} in env-config.js with:`, envVars[placeholder] ? '***SET***' : 'NOT SET');
            } else {
                console.log(`No instances of ${placeholder} found in env-config.js to replace`);
            }
        });
        
        fs.writeFileSync(envConfigPath, envConfigContent, 'utf8');
        console.log('env-config.js updated successfully');
    } else {
        console.log('env-config.js not found, skipping...');
    }
    
    console.log('Environment variables injected successfully');
    
} catch (error) {
    console.error('Error injecting environment variables:', error);
    process.exit(1);
}

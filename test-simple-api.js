/**
 * Simple test script for OpenAI API
 * Tests basic functionality with a hello message
 */

const fetch = require('node-fetch').default;

async function testHelloMessage() {
    const apiKey = process.env.OPENAI_API_KEY || 'your-api-key-here';
    
    const payload = {
        model: 'gpt-4o-mini',
        temperature: 0,
        prompt: { "id": "pmpt_68ae03fd6e6481908a8939a9e9272e130cf3d534ebfbb3d9" },
        messages: [
            {
                "role": "user",
                "content": "Say hello!"
            }
        ]
    };

    try {
        console.log('Testing OpenAI API...');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            return;
        }

        const data = await response.json();
        console.log('Success! Response:', JSON.stringify(data, null, 2));
        
        if (data.choices && data.choices[0]) {
            console.log('\nMessage:', data.choices[0].message.content);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Run the test
testHelloMessage();

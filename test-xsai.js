#!/usr/bin/env node

import { streamText } from '@xsai/stream-text';
import { generateText } from '@xsai/generate-text';
import { extractReasoningStream } from '@xsai/utils-reasoning';

// Test configuration - replace with your actual API details
const testConfig = {
  baseURL: 'https://api.deepseek.com/v1', // Example - replace with your API endpoint
  apiKey: 'your-api-key-here', // Replace with your actual API key
  model: 'deepseek-r1' // Replace with your model
};

async function testGenerateText() {
  console.log('🧪 Testing xsai generateText integration...\n');
  
  try {
    const { text } = await generateText({
      apiKey: testConfig.apiKey,
      baseURL: testConfig.baseURL,
      model: testConfig.model,
      messages: [{
        role: 'user',
        content: 'Summarize this in 3-5 words: Hello, how are you today? I am doing well, thanks for asking!'
      }],
      temperature: 0.2,
      max_tokens: 20
    });

    console.log('✅ GenerateText test successful!');
    console.log('📝 Summary result:', text.trim());
    
  } catch (error) {
    console.error('❌ GenerateText test failed:', error.message);
  }
}

async function testStreamText() {
  console.log('\n🧪 Testing xsai streamText with reasoning extraction...\n');
  
  try {
    const { textStream } = await streamText({
      apiKey: testConfig.apiKey,
      baseURL: testConfig.baseURL,
      model: testConfig.model,
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Use <think></think> tags to show your reasoning process.' },
        { role: 'user', content: 'Why is the sky blue? Please think through this step by step.' }
      ]
    });

    // Extract reasoning and content streams
    const { reasoningStream, textStream: contentStream } = extractReasoningStream(textStream);

    console.log('🧠 Reasoning process:');
    console.log('='.repeat(50));
    let reasoningText = '';
    for await (const chunk of reasoningStream) {
      process.stdout.write(chunk);
      reasoningText += chunk;
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n💬 Final answer:');
    console.log('='.repeat(50));
    for await (const chunk of contentStream) {
      process.stdout.write(chunk);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('\n✅ StreamText test successful!');
    
  } catch (error) {
    console.error('❌ StreamText test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing xsai integration for thinking-model-client\n');
  
  // Check if configuration is set
  if (testConfig.apiKey === 'your-api-key-here') {
    console.log('⚠️  Please update the testConfig in this file with your actual API details before running tests.');
    console.log('📝 Edit the testConfig object at the top of this file.');
    return;
  }
  
  await testGenerateText();
  await testStreamText();
  
  console.log('\n🎉 All tests completed!');
}

runTests().catch(console.error);

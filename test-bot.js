const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
config();

async function testBot() {
    console.log('🧪 Testing DigitalDeltaGaming PrisonRP Bot...\n');

    // Test 1: Environment Variables
    console.log('1. Testing Environment Variables:');
    const requiredEnvVars = ['DISCORD_TOKEN', 'CLIENT_ID'];
    let envPassed = true;

    requiredEnvVars.forEach(envVar => {
        if (process.env[envVar]) {
            console.log(`   ✅ ${envVar}: Set`);
        } else {
            console.log(`   ❌ ${envVar}: Missing`);
            envPassed = false;
        }
    });

    if (!envPassed) {
        console.log('\n❌ Please set all required environment variables in .env file');
        return;
    }

    // Test 2: File Structure
    console.log('\n2. Testing File Structure:');
    const requiredFiles = [
        'src/index.js',
        'src/database/database.js',
        'src/handlers/menuHandler.js',
        'src/handlers/commandHandler.js',
        'src/handlers/eventHandler.js',
        'src/flows/qaFlows.js',
        'src/events/ready.js',
        'src/events/messageCreate.js',
        'src/events/interactionCreate.js',
        'src/commands/menu.js',
        'src/commands/setup.js',
        'src/commands/help.js'
    ];

    let filesPassed = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`   ✅ ${file}`);
        } else {
            console.log(`   ❌ ${file}: Missing`);
            filesPassed = false;
        }
    });

    // Test 3: Database
    console.log('\n3. Testing Database:');
    try {
        const Database = require('./src/database/database');
        const db = new Database();
        
        // Test database initialization
        await db.init();
        console.log('   ✅ Database initialization');
        
        // Test basic operations
        await db.setConfig('test_key', 'test_value');
        const testValue = await db.getConfig('test_key');
        if (testValue?.value === 'test_value') {
            console.log('   ✅ Database read/write operations');
        } else {
            console.log('   ❌ Database read/write operations');
        }
        
        // Cleanup test data
        await db.run('DELETE FROM bot_config WHERE key = ?', ['test_key']);
        
        await db.close();
    } catch (error) {
        console.log(`   ❌ Database test failed: ${error.message}`);
        filesPassed = false;
    }

    // Test 4: Q&A Flows
    console.log('\n4. Testing Q&A Flows:');
    try {
        const { QAFlowManager, QA_FLOWS } = require('./src/flows/qaFlows');
        
        const flowTypes = Object.keys(QA_FLOWS);
        console.log(`   ✅ Loaded ${flowTypes.length} Q&A flows:`);
        
        flowTypes.forEach(flowType => {
            const flow = QA_FLOWS[flowType];
            console.log(`      • ${flow.title} (${flow.questions.length} questions)`);
        });
        
        // Test validation
        const qaManager = new QAFlowManager(null, console);
        const validation = qaManager.validateAnswer('staff-application', 2, '25'); // Age question
        if (validation.valid) {
            console.log('   ✅ Q&A validation system');
        } else {
            console.log('   ❌ Q&A validation system');
        }
        
    } catch (error) {
        console.log(`   ❌ Q&A Flow test failed: ${error.message}`);
        filesPassed = false;
    }

    // Test 5: Commands
    console.log('\n5. Testing Commands:');
    try {
        const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));
        
        commandFiles.forEach(file => {
            try {
                const command = require(`./src/commands/${file}`);
                if (command.data && command.execute) {
                    console.log(`   ✅ ${command.data.name} command`);
                } else {
                    console.log(`   ❌ ${file}: Invalid structure`);
                    filesPassed = false;
                }
            } catch (error) {
                console.log(`   ❌ ${file}: ${error.message}`);
                filesPassed = false;
            }
        });
        
    } catch (error) {
        console.log(`   ❌ Command test failed: ${error.message}`);
        filesPassed = false;
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (envPassed && filesPassed) {
        console.log('🎉 All tests passed! Your bot is ready to run.');
        console.log('\nNext steps:');
        console.log('1. npm run deploy  # Deploy slash commands');
        console.log('2. npm start       # Start the bot');
        console.log('3. Use /setup in Discord to configure');
    } else {
        console.log('❌ Some tests failed. Please fix the issues above.');
    }
}

testBot().catch(console.error); 
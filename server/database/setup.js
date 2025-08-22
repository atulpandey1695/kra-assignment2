const { setupDatabase } = require('./connection');

async function main() {
  try {
    console.log('🔧 Setting up database...');
    await setupDatabase();
    console.log('✅ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

main();

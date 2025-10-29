module.exports = async (req, res) => {
  try {
    const envCheck = {
      BOT_TOKEN: process.env.BOT_TOKEN ? '✅ Set' : '❌ Missing',
      ADMIN_ID: process.env.ADMIN_ID ? '✅ Set' : '❌ Missing',
      ADMIN_ASSISTANT: process.env.ADMIN_ASSISTANT ? '✅ Set' : '❌ Missing',
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? '✅ Set' : '❌ Missing',
    };

    res.status(200).json({
      status: 'OK',
      environment: envCheck,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
};

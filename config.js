// Database configuration
// Update these values with your database credentials
// Or use environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

module.exports = {
    database: {
        host: process.env.DB_HOST || '49.128.184.34',
        port: parseInt(process.env.DB_PORT) || 3406,
        user: process.env.DB_USER || 'u143_8Iv5ZNvRLS',
        password: process.env.DB_PASSWORD || 'uh14Qyd.I.pP@Frog^yLy7kR',
        database: process.env.DB_NAME || 's143_db_unturned'
    }
};


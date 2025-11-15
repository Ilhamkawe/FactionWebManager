// Copy this file to config.js and update with your database credentials
// Or use environment variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

module.exports = {
    database: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'db_unturned'
    }
};


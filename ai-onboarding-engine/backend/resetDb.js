const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/aionboarding')
    .then(async () => {
        console.log('Connected to MongoDB. Dropping database...');
        await mongoose.connection.db.dropDatabase();
        console.log('Database successfully reset!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    });

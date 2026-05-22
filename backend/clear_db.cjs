const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/healthcare_app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB. Clearing database...');
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped.');
    mongoose.connection.close();
}).catch(err => console.log(err));

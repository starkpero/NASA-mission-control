const http = require('http');

const app = require('./app');
const { mongoConnect } = require('./services/mongo');
const { loadPlanetsData } = require('./models/planets.model');
const { loadLaunchData } = require('./models/launches.model');


const PORT = process.env.PORT || 8000;

const server = http.createServer(app);


async function startServer() {
    //We've to set the below 4 properties so that it dosen't show any warnings
    await mongoConnect();
    await loadPlanetsData();
    await loadLaunchData();

    server.listen(PORT, () => {
        console.log(`Server is listening on PORT ${PORT}...`);
    });
}


startServer();
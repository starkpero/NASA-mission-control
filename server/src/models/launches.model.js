const axios = require('axios');

const launchesDatabase = require('./launches.mongo');
const planetsMongo = require('./planets.mongo');
const planets = require('./planets.mongo');

const launches = new Map();

const DEFAULT_FLIGHT_NUMBER = 100;
//let latestFlightNumber = 100;

// const launch = {
//     flightNumber: 100, //flight_numeber
//     mission: 'Kepler Exploration X', //name
//     rocket: 'Explorer IS1', //rocket.name
//     launchDate: new Date('Decemeber 27,2030'), //date_local
//     target: 'Starks planet', //NA
//     customers: ['SpaceX', 'NASA'], //payload.customers for each payload
//     upcoming: true, //upcoming
//     success: true, //success  
// };

// saveLaunch(launch);
// //launches.set(launch.flightNumber, launch);

const SPACEX_API_URL = 'https://api.spacexdata.com/v4/launches/query';


async function populateLaunches() {
    console.log('Downloading launch data');
    const response = await axios.post(SPACEX_API_URL, {

        query: {},
        options: {
            pagination: false,
            populate: [{
                    path: 'rocket',
                    select: {
                        name: 1
                    }
                },
                {
                    path: 'payloads',
                    select: {
                        'customers': 1
                    }
                }
            ]
        }

    });

    if (response.status !== 200) {
        console.log('Problem downloading the launch data');
        throw new Error('Launch data download failed');
    }



    const launchDocs = response.data.docs;
    for (const launchDoc of launchDocs) {
        const payloads = launchDoc['payloads'];
        const customers = payloads.flatMap((payload) => {
            return payload['customers'];
        })

        const launch = {
            flightNumber: launchDoc['flight_number'],
            mission: launchDoc['name'],
            rocket: launchDoc['rocket']['name'],
            launchDate: launchDoc['date_local'],
            upcoming: launchDoc['upcoming'],
            success: launchDoc['success'],
            customers: customers,
        };
        console.log(` ${launch.flightNumber}  ${launch.mission}`);
        //TODO: populate launches collection
        await saveLaunch(launch);
    }
}



async function loadLaunchData() {
    const firstLaunch = await findLaunch({
        flightNumber: 1,
        rocket: 'Falcon 1',
        mission: 'FalconSat'
    });

    if (firstLaunch) {
        console.log('Launch data already loaded');
        return;
    } else {
        await populateLaunches();
    }
}


async function findLaunch(filter) {
    return await launchesDatabase.findOne(filter);
}


async function existsLaunchWithId(launchId) {
    return await findLaunch({
        flightNumber: launchId,
    });
}

async function getLatestFlightNumer() {
    const latestLaunch = await launchesDatabase
        .findOne() //This will give the latest launch data since we're sorting in descending order
        .sort('-flightNumber');
    if (!latestLaunch) {
        return DEFAULT_FLIGHT_NUMBER;
    }
    return latestLaunch.flightNumber;
}

async function getAllLaunches(skip, limit) {
    return await launchesDatabase
        .find({}, {
            '_id': 0,
            '__v': 0
        })
        .sort({ flightNumber: 1 })
        .skip(skip)
        .limit(limit);
}

async function saveLaunch(launch) {
    await launchesDatabase.findOneAndUpdate({
        flightNumber: launch.flightNumber,
    }, {
        launch
    }, {
        upsert: true
    });
}


async function scheduleNewLaunch(launch) {
    const planet = await planets.findOne({
        keplerName: launch.target,
    });

    if (!planet) {
        throw new Error('No matching planet found');
    }

    const newFlightNumber = await getLatestFlightNumer() + 1;

    const newLaunch = Object.assign(launch, {
        success: true,
        upcoming: true,
        customers: ['NASA', 'STARK INDUSTRIES'],
        flightNumber: newFlightNumber
    });

    await saveLaunch(newLaunch);
}

//The below function was for adding launch to a map
// function addNewLaunch(launch) {
//     latestFlightNumber++;
//     //Object.assign will add additional properties in that particular object,in case we change other properties,they get overrided
//     launches.set(latestFlightNumber, Object.assign(launch, {
//         upcoming: true,
//         success: true,
//         customers: ['spaceX', 'NASA'],
//         flightNumber: latestFlightNumber,
//     }));
// }

async function abortLaunchById(launchId) {
    // const aborted = launches.get(launchId);
    // aborted.upcoming = false;
    // aborted.success = false;
    // return aborted;

    const aborted = await launchesDatabase.updateOne({
        flightNumber: launchId,
    }, {
        upcoming: false,
        success: false
    });

    return aborted.ok === 1 && aborted.nModified === 1;
}



module.exports = {
    loadLaunchData,
    getAllLaunches,
    existsLaunchWithId,
    scheduleNewLaunch,
    abortLaunchById,
};
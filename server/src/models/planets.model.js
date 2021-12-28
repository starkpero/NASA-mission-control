const fs = require('fs');
const path = require('path');
const parse = require('csv-parse');

const planets = require('./planets.mongo');

//const habitablePlanets = [];

function isHabitablePlanet(planet) {
    return planet['koi_disposition'] === 'CONFIRMED' && planet['koi_insol'] > 0.36 && planet['koi_insol'] < 1.11 &&
        planet['koi_prad'] < 1.6;
}

function loadPlanetsData() {
    return new Promise((resolve, reject) => {
        fs.createReadStream(path.join(__dirname, '..', '..', 'data', 'Kepler_data.csv'))
            .pipe(parse({
                comment: '#',
                columns: true,
            })) //pipe function is connecting readable stream source(kepler file) to writable stream destination(parse)
            .on('data', async(data) => {
                if (isHabitablePlanet(data)) {
                    //habitablePlanets.push(data);

                    // TODO: Replace below create with insert + update = upsert  //mongoose provides upsert 
                    savePlanet(data);
                }

            })
            .on('error', (err) => {
                console.log(err);
                reject(err);
            })
            .on('end', async() => {
                // console.log(habitablePlanets.map((planet) => {
                //     return planet['kepler_name'];
                // }));
                const countPlanetsFound = (await getAllplanets()).length;
                console.log(`${countPlanetsFound} habitable planets found!`);
                //console.log('Done');
                resolve();
            });
    });
}


async function getAllplanets() {
    return await planets.find({}, {
        '_id': 0,
        '__v': 0
    });
}

async function savePlanet(planet) {
    try {
        await planets.updateOne({
            keplerName: planet.kepler_name
        }, {
            keplerName: planet.kepler_name
        }, {
            upsert: true,
        });
    } catch (err) {
        console.error(`Could not save planet ${err}`);
    }

}


module.exports = {
    loadPlanetsData,
    getAllplanets,
};
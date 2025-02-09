// Data updater loop
let updateDataID = null;
let mazeGenerationStep = 0;
let requestedMazeGenerationStep = null;
let labyrinthDataSteps = null;
let labyrinthDataNumSteps = null;
let labyrinthData = null;
let labyrinthDataInitialState = null;
let lastUpdateTime = 0;
let finalThrottledUpdatePosted = false;
let intervalDuration = 1000; // frequency (ms) of data updater cycle
const throttleInterval = 8; // Throttle to ~120 FPS (8ms) - target data exchange frequency between data updater (this file, web worker) and renderer (main thread)
let batchSteps = 1; // how many steps/updates to perform per intervalDuration cycle (workaround for real maximum of 4ms interval)

function postThrottledMessage(labyrinthData) {
    const currentTime = performance.now();
    if (currentTime - lastUpdateTime > throttleInterval) {
        const flatArray = new Uint8Array(labyrinthData.length * labyrinthData[0].length);
        for (let i = 0; i < labyrinthData.length; i++) {
            for (let j = 0; j < labyrinthData[0].length; j++) {
                flatArray[i * labyrinthData[0].length + j] = labyrinthData[i][j];
            }
        }
        postMessage(flatArray, [flatArray.buffer]);
        lastUpdateTime = currentTime;
        return true;
    }
}

function updateData() {

    if (mazeGenerationStep >= labyrinthDataNumSteps) {
        console.log('Data updater: all updates completed, skipping update')
        if (!finalThrottledUpdatePosted) {
            let status = postThrottledMessage(labyrinthData);
            if (status) {
                finalThrottledUpdatePosted = true;
                postMessage({'status':'done'})
            }
        }
        return;
    }
    // Fastforward/rewind logic - a lot of potential for optimization if needed
    // Currently just restarts step updates from 0 until requested step is reached
    let nextStepData = null;
    if (requestedMazeGenerationStep !== null) {
        console.log("Data updater: fastforwarding/rewinding to ", requestedMazeGenerationStep)
        mazeGenerationStep = 0;
        nextStepData = labyrinthDataInitialState;
        for (mazeGenerationStep; mazeGenerationStep < requestedMazeGenerationStep; mazeGenerationStep++) {
            if (mazeGenerationStep >= labyrinthDataNumSteps) {
                break
            }
            const stepStart = mazeGenerationStep * 3;
            nextStepData[labyrinthDataSteps[stepStart]][labyrinthDataSteps[stepStart+1]] = labyrinthDataSteps[stepStart+2];
        }
        requestedMazeGenerationStep = null;
    } else {
        // Normal maze data update
        nextStepData = labyrinthData;
        for (let step = 0; step < batchSteps; step++) {
            if (mazeGenerationStep >= labyrinthDataNumSteps) {
                break
            }
            const stepStart = mazeGenerationStep * 3;
            nextStepData[labyrinthDataSteps[stepStart]][labyrinthDataSteps[stepStart+1]] = labyrinthDataSteps[stepStart+2];
            mazeGenerationStep++;
        }
    }

    labyrinthData = nextStepData;
    postThrottledMessage(labyrinthData);
};
self.onerror = (err) => {
    console.error("Data updater error:", err.message);
};
self.onmessage = function(event) {
    const message = event.data;

    if (message.action === 'Start') {
        if (updateDataID === null) {
            console.log('Data updater: starting up...');
            labyrinthDataSteps = message.labyrinthDataSteps;
            labyrinthDataNumSteps = message.labyrinthDataSteps.length / 3;
            labyrinthData = message.labyrinthDataInitialState;
            labyrinthDataInitialState = message.labyrinthDataInitialState;
            updateDataID = setInterval(updateData, intervalDuration);
        }
    }

    if (message.action === 'Stop') {
        if (updateDataID !== null) {
            clearInterval(updateDataID);
            updateDataID = null;
        }
            console.log('Data updater: stopping...')
            mazeGenerationStep = 0;
            labyrinthDataSteps = null;
            labyrinthData = null;
            console.log('Data updater: stopped!')
    }

    if (message.action === 'Pause') {
        if (updateDataID !== null) {
            console.log('Data updater: pausing...')
            clearInterval(updateDataID);
            updateDataID = null;        
            console.log('Data updater: paused!')
        }
    }

    if (message.action === 'Resume') {
        if (updateDataID === null) {
            console.log('Data updater: resuming...')
            updateDataID = setInterval(updateData, intervalDuration);          
            console.log('Data updater: resumed!')
        }
    }

    if (message.action === 'Change speed') {
        if (updateDataID !== null) {
            console.log('Data updater: changing speed...')
            intervalDuration = message.speedParameters.intervalDuration;
            batchSteps = message.speedParameters.batchSteps;

            clearInterval(updateDataID);
            updateDataID = null;

            updateDataID = setInterval(updateData, intervalDuration); 
            
            console.log("Data updater: current speed is")
            console.log(intervalDuration)
            console.log(batchSteps)

        }
    }
}

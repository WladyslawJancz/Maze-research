// Data updater loop
let updateDataID = null;
let mazeGenerationStep = 0;
let labyrinthDataSteps = null;
let labyrinthData = null;
let lastUpdateTime = 0;
let finalThrottledUpdatePosted = false;
let intervalDuration = 8; // frequency (ms) of data updater cycle
const throttleInterval = 8; // Throttle to ~120 FPS (8ms) - target data exchange frequency between data updater and renderer (main thread)
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

    if (mazeGenerationStep >= labyrinthDataSteps.length) {
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
    let nextStepData = labyrinthData;
    for (let step = 0; step < batchSteps; step++) {
        if (mazeGenerationStep >= labyrinthDataSteps.length) {
            break
        }
        const nextStepChange = labyrinthDataSteps[mazeGenerationStep];
        for (const subStep of nextStepChange) {
            const nextStepChangeY = subStep[0];
            const nextStepChangeX = subStep[1];
            const nextStepChangeValue = subStep[2];
            nextStepData[nextStepChangeY][nextStepChangeX] = nextStepChangeValue;
        }
        mazeGenerationStep++;
    }
    labyrinthData = nextStepData;
    postThrottledMessage(labyrinthData);
};
self.onerror = (err) => {
    console.error("Worker script error:", err.message);
};
self.onmessage = function(event) {
    const message = event.data;

    if (message.action === 'Start') {
        if (updateDataID === null) {
            console.log('Data updater: starting up...');
            labyrinthDataSteps = message.labyrinthDataSteps;
            labyrinthData = message.labyrinthDataInitialState;
            updateDataID = setInterval(updateData, intervalDuration);
        }
    }

    if (message.action === 'Stop') {
        if (updateDataID !== null) {
            console.log('Data updater: stopping...')
            clearInterval(updateDataID);
            mazeGenerationStep = 0;
            labyrinthDataSteps = null;
            labyrinthData = null;
            updateDataID = null;
            console.log('Data updater: stopped!')
        }
    }
}

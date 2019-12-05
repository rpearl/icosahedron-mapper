const PixelPusherRegistry = require('pixelpusher-driver').default;
const readlineSync = require('readline-sync');

const registry = new PixelPusherRegistry();
function dbgStrip(strip, buf) {
}

const fakeController = {
    setStrip(strip, buf) {
        const nonzeros = [];
        for (let i = 0; i < buf.length; i += 3) {
            if (buf[i] !== 0 || buf[i+1] !== 0 || buf[i+2] !== 0) {
                nonzeros.push(i/3);
            }
        }
        console.log(`strip: ${strip}, nonzeros: ${nonzeros}`);
    },
    sync() {},
};

let controllers = [];
registry.on('discovered', controller => {
    controller.applyCorrection = (x) => x;
    controllers.push(controller);
    setImmediate(runloop);
});

registry.on('pruned', controller => {
    controllers = controllers.filter(c => c.id !== controller.id);
});

function color(rgb) {
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    return [r, g, b];
}

const stripColors = [
    color(0x00ff00),
    color(0xff00ff),
    color(0xff0000),
    color(0xffa500),
    color(0xffff00),
];

function runloop() {
    let strip = 0;
    let chunk = 0;
    const pixelsPerStrip = 180;
    const pixelsPerChunk = 15;
    const chunksPerStrip = pixelsPerStrip / pixelsPerChunk;
    const numStrips = stripColors.length;

    while (true) {

        const stripBufs = stripColors.map(() => new Buffer(3*pixelsPerStrip));

        const activeBuf = stripBufs[strip];
        const color = stripColors[strip];

        for (let pixel = 0; pixel < pixelsPerChunk; pixel++) {
            let offset = 3*(chunk * pixelsPerChunk + pixel);
            activeBuf[offset+0] = color[0];
            activeBuf[offset+1] = color[1];
            activeBuf[offset+2] = color[2];
        }

        controller = controllers[0];
        for (let s = 0; s < numStrips; s++) {
            controller.setStrip(s, stripBufs[s]);
        }
        console.log('sync');
        controller.sync();

        chunk++;
        if (chunk === chunksPerStrip) {
            chunk = 0;
            strip++;
            if (strip === numStrips) {
                strip = 0;
            }
        }
        readlineSync.question('press enter for next');
    }
}
registry.start();
//runloop()

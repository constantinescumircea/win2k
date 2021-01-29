const https = require('https');
const fs = require('fs');

new class {
    constructor() {
        this.threads = 100
        this.start = 0
        this.end = 4095
        this.destination = 'dest\\'
        this.name = `blk000000000` // `grp000000000`
        this.ext = 'bin'
        this.path = 'https://bellard.org/jslinux/win2k_v2/'
        this.finished = -1
        this.proc = 0
        this.index = this.start - 1
        this.total = this.end - this.start
        this.invalid_files = []
        this.main()
    }
    download = (url, dest, cb) => {
        const file = fs.createWriteStream(dest);
        const request = https.get(url, (response) => {
            // check if response is success
            if (response.statusCode !== 200) {
                return cb('Response status was ' + response.statusCode);
            }
            response.pipe(file);
        });
        // close() is async, call cb after close completes
        file.on('finish', () => file.close(cb));
        // check for request error too
        request.on('error', (err) => {
            fs.unlink(dest, () => {});
            return cb(err.message);
        });
        file.on('error', (err) => { // Handle errors
            fs.unlink(dest, () => {}); // Delete the file async. (But we don't check the result)
            return cb(err.message);
        });
    };
    loop() {
        let proc = `${(this.finished + 1) * 100 / this.total}`.split('.')[0]
        if (proc !== this.proc) {
            console.clear()
            console.log(`Downloading: ${this.proc}%`)
            this.proc = proc
        }




        this.index++;
        if (this.index > this.end) return
        let file_name = this.name.substr(0, this.name.length - `${this.index}`.length) + this.index + '.' + this.ext
        let url_path = `${this.path}${file_name}`
        let file_path = `${this.destination}${file_name}`
        this.download(url_path, file_path, (m) => {
            this.finished++;
            if (m === 'Response status was 404') this.invalid_files.push(file_path)
            if (this.total - this.finished === 0) setTimeout(() => this.clean(), 1000);
            else this.loop();
        })
    }
    main() {
        this.finished = -1
        this.index = this.start - 1
        for (let i = 0; i < this.threads; i++) this.loop()
    }
    clean() {
        console.clear()
        console.log(`Clearing Invalid files`)
        this.invalid_files.map(f => {
            fs.unlink(f, () => {})
        })
        console.clear()
        console.log(`Done`)
    }
}
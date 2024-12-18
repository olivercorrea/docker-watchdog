const { Client } = require("ssh2");
const fs = require("fs");

function getRemoteSystemStats(host, port, username, keyFilename) {
  return new Promise((resolve, reject) => {
    const conn = new Client();

    conn.on("ready", () => {
      conn.exec(
        `
        python3 -c "
        import psutil, json
        stats = {
          'cpu_percent': psutil.cpu_percent(interval=1),
          'memory': psutil.virtual_memory()._asdict(),
          'disk': psutil.disk_usage('/')._asdict()
        }
        print(json.dumps(stats))
        "
      `,
        (err, stream) => {
          if (err) {
            reject(err);
          }

          let output = "";
          stream.on("data", (data) => {
            output += data.toString();
          });

          stream.on("close", (code, signal) => {
            if (code !== 0) {
              reject(new Error(`Command failed with code ${code}`));
            }

            try {
              const stats = JSON.parse(output);
              resolve(stats);
            } catch (err) {
              reject(err);
            }

            conn.end();
          });
        },
      );
    });

    conn.on("error", (err) => {
      reject(err);
    });

    conn.connect({
      host,
      port,
      username,
      privateKey: fs.readFileSync(keyFilename),
    });
  });
}

async function main() {
  const host = "44.202.22.157";
  const port = 22; // Default SSH port
  const username = "ubuntu"; // Default username for Ubuntu instances
  const keyFilename = "/home/jomaol/Documents/DAEA/keys/ubuntu1.pem"; // Path to your PEM key

  while (true) {
    try {
      const stats = await getRemoteSystemStats(
        host,
        port,
        username,
        keyFilename,
      );
      if (stats) {
        const cpuPercent = stats.cpu_percent;
        const memoryInfo = stats.memory;
        const diskInfo = stats.disk;

        console.log(`CPU Usage: ${cpuPercent}%`);
        console.log(
          `Memory Usage: ${(memoryInfo.used / 1024 ** 2).toFixed(2)} MB / ${(memoryInfo.total / 1024 ** 2).toFixed(2)} MB (${memoryInfo.percent}%)`,
        );
        console.log(
          `Disk Usage: ${(diskInfo.used / 1024 ** 3).toFixed(2)} GB / ${(diskInfo.total / 1024 ** 3).toFixed(2)} GB (${diskInfo.percent}%)`,
        );
      }
    } catch (err) {
      console.error(err);
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // Adjust the interval as needed
  }
}

main();

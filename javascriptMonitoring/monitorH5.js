const Docker = require("dockerode");
const docker = new Docker({ host: "http://54.147.24.159", port: 2375 });
const Client = require("ssh2").Client;
const conn = new Client();

async function getContainerStats(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const inspect = await container.inspect();
    const stats = await container.stats({ stream: false });

    const cpuUsage = stats.cpu_stats.cpu_usage.total_usage;
    const systemCpuUsage = stats.cpu_stats.system_cpu_usage;
    const memoryUsage = stats.memory_stats.usage;

    const cpuPercent = (cpuUsage / systemCpuUsage) * 100.0;

    return {
      containerId,
      status: inspect.State.Status,
      cpuUsage: cpuPercent.toFixed(2) + "%",
      memoryUsage: (memoryUsage / (1024 * 1024)).toFixed(2) + " MB",
    };
  } catch (err) {
    console.error(
      `Error al obtener estadísticas del contenedor ${containerId}: ${err}`,
    );
    return null;
  }
}

async function getHostStats() {
  return new Promise((resolve, reject) => {
    let cpuUsage = "";
    let memoryUsage = "";

    conn
      .on("ready", () => {
        conn.exec(
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F. '{print $1}'",
          (err, stream) => {
            if (err) return reject(err);
            stream.on("data", (data) => {
              cpuUsage = data.toString().trim() + "%";
            });

            stream.on("close", () => {
              conn.exec(
                "free -m | awk 'NR==2{printf \"%s\", $3}'",
                (err, stream) => {
                  if (err) return reject(err);
                  stream.on("data", (data) => {
                    memoryUsage = data.toString().trim() + " MB";
                  });

                  stream.on("close", () => {
                    conn.end();
                    resolve({ cpuUsage, memoryUsage });
                  });
                },
              );
            });
          },
        );
      })
      .connect({
        host: "54.147.24.159",
        port: 22,
        username: "ubuntu",
        privateKey: require("fs").readFileSync(
          "/home/jomaol/Documents/DAEA/keys/ubuntu03.pem",
        ),
      });
  });
}

const contenedores = [
  "digimon-microservice-container",
  "digimon-frontend-container",
];

setInterval(async () => {
  console.log("------------------------------------------------");
  console.log("Contenedores:");
  for (const containerId of contenedores) {
    const stats = await getContainerStats(containerId);
    if (stats) {
      console.log(`  ${stats.containerId}:`);
      console.log(`    Estado: ${stats.status}`);
      console.log(`    CPU Usage: ${stats.cpuUsage}`);
      console.log(`    Memory Usage: ${stats.memoryUsage}`);
    }
  }

  console.log("------------------------------------------------");
  console.log("Host:");
  const hostStats = await getHostStats();
  if (hostStats) {
    console.log(`  CPU Usage: ${hostStats.cpuUsage}`);
    console.log(`  Memory Usage: ${hostStats.memoryUsage}`);
  }
  console.log("------------------------------------------------");
}, 5000);

// kinda works

const Docker = require("dockerode");
const docker = new Docker({ host: "http://98.81.156.198", port: 2375 });
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

    console.log(`Contenedor: ${containerId}`);
    console.log(`Estado: ${inspect.State.Status}`);
    console.log(`CPU Usage: ${cpuPercent.toFixed(2)}%`);
    console.log(`Memory Usage: ${(memoryUsage / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`----------------------------------------`);
  } catch (err) {
    console.error(
      `Error al obtener estadísticas del contenedor ${containerId}: ${err}`,
    );
  }
}

async function getHostStats() {
  try {
    conn
      .on("ready", () => {
        conn.exec(
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F. '{print $1}'",
          (err, stream) => {
            if (err) throw err;
            stream.on("data", (data) => {
              console.log(`----------------------------------------`);
              console.log(`Host: 98.81.156.198`);
              console.log(`CPU Usage: ${data.toString().trim()}%`);
            });
          },
        );

        conn.exec("free -m | awk 'NR==2{printf \"%s\", $3}'", (err, stream) => {
          if (err) throw err;
          stream.on("data", (data) => {
            console.log(`Memory Usage: ${data.toString().trim()} MB`);
            console.log(`----------------------------------------`);
          });
        });
      })
      .connect({
        host: "98.81.156.198",
        port: 22,
        username: "ubuntu",
        privateKey: require("fs").readFileSync(
          "/home/jomaol/Documents/DAEA/keys/ubuntu02.pem",
        ),
      });
  } catch (err) {
    console.error(`Error al obtener estadísticas del host: ${err}`);
  }
}

const contenedores = [
  "digimon-microservice-container",
  "digimon-frontend-container",
];

setInterval(() => {
  contenedores.forEach((containerId) => {
    getContainerStats(containerId);
  });
  getHostStats();
}, 5000);

// It works but awfull

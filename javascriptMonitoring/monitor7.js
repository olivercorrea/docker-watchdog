const Docker = require("dockerode");
const docker = new Docker({ host: "http://98.81.156.198", port: 2375 });

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

const contenedores = [
  "digimon-microservice-container",
  "digimon-frontend-container",
];

setInterval(() => {
  contenedores.forEach((containerId) => {
    getContainerStats(containerId);
  });
}, 5000);

// works perfectly

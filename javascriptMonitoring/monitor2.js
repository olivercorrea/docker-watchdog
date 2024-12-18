const Docker = require("dockerode");
const docker = new Docker({ host: "http://54.173.170.215", port: 2375 });

async function getContainerStats(containerId) {
  try {
    const container = docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });

    const cpuUsage = stats.cpu_stats.cpu_usage.total_usage;
    const systemCpuUsage = stats.cpu_stats.system_cpu_usage;
    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;

    const cpuPercent = (cpuUsage / systemCpuUsage) * 100.0;
    const memoryPercent = (memoryUsage / memoryLimit) * 100.0;

    console.log(`CPU Usage: ${cpuPercent.toFixed(2)}%`);
    console.log(`Memory Usage: ${(memoryUsage / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Memory Limit: ${(memoryLimit / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`Memory Usage Percentage: ${memoryPercent.toFixed(2)}%`);
  } catch (err) {
    console.error(err);
  }
}

const containerId = "42e922bc4c5f"; // Replace with your container ID
setInterval(() => getContainerStats(containerId), 5000); // Adjust the interval as needed

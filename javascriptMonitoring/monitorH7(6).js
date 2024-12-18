// Importamos la biblioteca Dockerode para interactuar con Docker
const Docker = require("dockerode");

// Creamos una instancia de Docker con la configuración del host y puerto
const docker = new Docker({ host: "http://34.230.31.241", port: 2375 });

// Importamos la biblioteca ssh2 para conectarnos a la máquina host via SSH
const Client = require("ssh2").Client;
const conn = new Client();

// Función asíncrona para obtener las estadísticas de un contenedor
async function getContainerStats(containerId) {
  try {
    // Obtenemos el contenedor por su ID
    const container = docker.getContainer(containerId);

    // Obtenemos la información de inspección del contenedor
    const inspect = await container.inspect();

    // Obtenemos las estadísticas del contenedor
    const stats = await container.stats({ stream: false });

    // Calculamos el uso de CPU como porcentaje
    const cpuUsage = stats.cpu_stats.cpu_usage.total_usage;
    const systemCpuUsage = stats.cpu_stats.system_cpu_usage;
    const cpuPercent = (cpuUsage / systemCpuUsage) * 100.0;

    // Calculamos el uso de memoria en MB
    const memoryUsage = stats.memory_stats.usage;
    const memoryUsageMB = (memoryUsage / (1024 * 1024)).toFixed(2) + " MB";

    // Devolvemos un objeto con las estadísticas del contenedor
    return {
      containerId,
      status: inspect.State.Status,
      cpuUsage: cpuPercent.toFixed(2) + "%",
      memoryUsage: memoryUsageMB,
    };
  } catch (err) {
    // Mostramos un error si no se pueden obtener las estadísticas del contenedor
    console.error(
      `Error al obtener estadísticas del contenedor ${containerId}: ${err}`
    );
    return null;
  }
}

// Función asíncrona para obtener las estadísticas del host
async function getHostStats() {
  // Devolvemos una promesa que se resolverá con las estadísticas del host
  return new Promise((resolve, reject) => {
    // Inicializamos variables para almacenar el uso de CPU y memoria
    let cpuUsage = "";
    let memoryUsage = "";

    // Conectamos a la máquina host via SSH
    conn
      // Esperamos a que la conexión esté lista
      .on("ready", () => {
        // Ejecutamos el comando "top" para obtener el uso de CPU
        conn.exec(
          // Comando para obtener el uso de CPU
          "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F. '{print $1}'",
          (err, stream) => {
            // Si hay un error, rechazamos la promesa
            if (err) return reject(err);

            // Escuchamos el evento "data" para obtener el resultado del comando
            stream.on("data", (data) => {
              // Almacenamos el uso de CPU en la variable cpuUsage
              cpuUsage = data.toString().trim() + "%";
            });

            // Escuchamos el evento "close" para saber cuando el comando ha terminado
            stream.on("close", () => {
              // Ejecutamos el comando "free" para obtener el uso de memoria
              conn.exec(
                // Comando para obtener el uso de memoria
                "free -m | awk 'NR==2{printf \"%s\", $3}'",
                (err, stream) => {
                  // Si hay un error, rechazamos la promesa
                  if (err) return reject(err);

                  // Escuchamos el evento "data" para obtener el resultado del comando
                  stream.on("data", (data) => {
                    // Almacenamos el uso de memoria en la variable memoryUsage
                    memoryUsage = data.toString().trim() + " MB";
                  });

                  // Escuchamos el evento "close" para saber cuando el comando ha terminado
                  stream.on("close", () => {
                    // Cerramos la conexión SSH
                    conn.end();

                    // Devolvemos un objeto con las estadísticas del host
                    resolve({ cpuUsage, memoryUsage });
                  });
                }
              );
            });
          }
        );
      })
      // Conectamos a la máquina host via SSH con los siguientes parámetros
      .connect({
        // Dirección IP del host
        host: "34.230.31.241",
        // Puerto del host
        port: 22,
        // Nombre de usuario para la conexión
        username: "ubuntu",
        // Clave privada para la conexión
        privateKey: require("fs").readFileSync(
          "/home/jomaol/Documents/DAEA/keys/ubuntu05.pem"
        ),
      });
  });
}

// Array de IDs de contenedores a monitorear
const contenedores = [
  "digimon-microservice-container",
  "digimon-frontend-container",
  "my-flask-container",
];

// Función que se ejecuta cada 13 segundos para monitorear el host y los contenedores
setInterval(async () => {
  console.log("\n============================================================");
  console.log(
    "            MONITOREO DEL HOST Y LOS CONTENEDORES                  "
  );
  console.log("============================================================\n");

  console.log("Host:");
  const hostStats = await getHostStats();
  if (hostStats) {
    console.log(`  Uso de CPU: ${hostStats.cpuUsage}`);
    console.log(`  Uso de Memoria: ${hostStats.memoryUsage}\n`);
  } else {
    console.log("  No se pudieron obtener las estadísticas del host.\n");
  }

  console.log("Contenedores:");
  // Iteramos sobre el array de IDs de contenedores
  for (const containerId of contenedores) {
    const stats = await getContainerStats(containerId);
    if (stats) {
      console.log(`  ${containerId}:`);
      console.log(`    Estado: ${stats.status}`);
      console.log(`    Uso de CPU: ${stats.cpuUsage}`);
      console.log(`    Uso de Memoria: ${stats.memoryUsage}\n`);
    } else {
      console.log(
        `  No se pudieron obtener las estadísticas del contenedor ${containerId}.\n`
      );
    }
  }

  console.log("============================================================\n");
}, 13000);

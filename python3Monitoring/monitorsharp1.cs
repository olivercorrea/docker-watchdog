using System;
using System.Collections.Generic;
using System.Threading;
using Docker.DotNet;
using Renci.SshNet;

class Program
{
    static void Main(string[] args)
    {
        // Configuración de Docker
        var dockerClient = new DockerClientConfiguration(new Uri("http://18.212.95.23:2375")).CreateClient();

        // Configuración de SSH
        var sshClient = new SshClient("18.212.95.23", "ubuntu", "/home/jomaol/Documents/DAEA/keys/ubuntu08.pem");

        // IDs de contenedores a monitorear
        var containers = new List<string>
        {
            "digimon-microservice-container",
            "digimon-frontend-container",
            "my-flask-container",
        };

        while (true)
        {
            Console.WriteLine("\n============================================================");
            Console.WriteLine("            MONITOREO DEL HOST Y LOS CONTENEDORES                  ");
            Console.WriteLine("============================================================\n");

            Console.WriteLine("Host:");
            var hostStats = GetHostStats(sshClient);
            if (hostStats != null)
            {
                Console.WriteLine($"  Uso de CPU: {hostStats.CpuUsage}");
                Console.WriteLine($"  Uso de Memoria: {hostStats.MemoryUsage}\n");
            }
            else
            {
                Console.WriteLine("  No se pudieron obtener las estadísticas del host.\n");
            }

            Console.WriteLine("Contenedores:");
            foreach (var containerId in containers)
            {
                var stats = GetContainerStats(dockerClient, containerId);
                if (stats != null)
                {
                    Console.WriteLine($"  {containerId}:");
                    Console.WriteLine($"    Estado: {stats.Status}");
                    Console.WriteLine($"    Uso de CPU: {stats.CpuUsage}");
                    Console.WriteLine($"    Uso de Memoria: {stats.MemoryUsage}\n");
                }
                else
                {
                    Console.WriteLine($"  No se pudieron obtener las estadísticas del contenedor {containerId}.\n");
                }
            }

            Console.WriteLine("============================================================\n");
            Thread.Sleep(5000);
        }
    }

    static HostStats GetHostStats(SshClient sshClient)
    {
        try
        {
            sshClient.Connect();

            var cpuUsage = sshClient.RunCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F. '{print $1}'").Result;
            var memoryUsage = sshClient.RunCommand("free -m | awk 'NR==2{printf \"%s\", $3}'").Result;

            sshClient.Disconnect();

            return new HostStats
            {
                CpuUsage = cpuUsage + "%",
                MemoryUsage = memoryUsage + " MB",
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al obtener estadísticas del host: {ex.Message}");
            return null;
        }
    }

    static ContainerStats GetContainerStats(DockerClient dockerClient, string containerId)
    {
        try
        {
            var container = dockerClient.Containers.GetContainerAsync(containerId).Result;
            var inspect = container.InspectAsync().Result;
            var stats = container.StatsAsync(new ContainerStatsParameters { Stream = false }).Result;

            var cpuUsage = stats.CpuStats.CpuUsage.TotalUsage;
            var systemCpuUsage = stats.CpuStats.SystemCpuUsage;
            var memoryUsage = stats.MemoryStats.Usage;

            var cpuPercent = (cpuUsage / systemCpuUsage) * 100.0;

            return new ContainerStats
            {
                ContainerId = containerId,
                Status = inspect.State.Status,
                CpuUsage = $"{cpuPercent:F2}%",
                MemoryUsage = $"{memoryUsage / (1024 * 1024):F2} MB",
            };
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error al obtener estadísticas del contenedor {containerId}: {ex.Message}");
            return null;
        }
    }
}

public class HostStats
{
    public string CpuUsage { get; set; }
    public string MemoryUsage { get; set; }
}

public class ContainerStats
{
    public string ContainerId { get; set; }
    public string Status { get; set; }
    public string CpuUsage { get; set; }
    public string MemoryUsage { get; set; }
}

// dotnet new console -o DockerMonitor
// dotnet add package Docker.DotNet
// dotnet add package Renci.SshNet

/*
 * Crear un nuevo proyecto en .NET Core:

    Abre la terminal y ejecuta el comando dotnet new console -o DockerMonitor para crear un nuevo proyecto de consola llamado "DockerMonitor".
    Cambia al directorio del proyecto con el comando cd DockerMonitor.

Instalar las bibliotecas necesarias:

    Instala la biblioteca Docker.DotNet con el comando dotnet add package Docker.DotNet.
    Instala la biblioteca Renci.SshNet con el comando dotnet add package Renci.SshNet.

Crear el archivo de código:

    Crea un nuevo archivo llamado Program.cs con el comando touch Program.cs (en macOS/Linux) o type nul > Program.cs (en Windows).
    Abre el archivo Program.cs con un editor de texto y copia y pega el código que te proporcioné anteriormente.

Compilar y ejecutar el proyecto:

    Compila el proyecto con el comando dotnet build.
    Ejecuta el proyecto con el comando dotnet run.

Comandos adicionales:

    dotnet restore: Restaura las dependencias del proyecto.
    dotnet clean: Limpia los archivos generados por la compilación.
    dotnet publish: Publica el proyecto en una carpeta.

Estructura del proyecto:

    DockerMonitor/: Directorio del proyecto.
    DockerMonitor/Program.cs: Archivo de código principal.
    DockerMonitor/DockerMonitor.csproj: Archivo de proyecto de .NET Core.

*/

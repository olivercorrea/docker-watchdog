import docker
import paramiko
import time

docker_client = docker.DockerClient(base_url='http://18.212.95.23:2375')

def get_container_stats(container_id):
    try:
        container = docker_client.containers.get(container_id)
        inspect = container.attrs
        stats = container.stats(stream=False)

        cpu_usage = stats['cpu_stats']['cpu_usage']['total_usage']
        system_cpu_usage = stats['cpu_stats']['system_cpu_usage']
        memory_usage = stats['memory_stats']['usage']

        cpu_percent = (cpu_usage / system_cpu_usage) * 100.0

        return {
            'containerId': container_id,
            'status': inspect['State']['Status'],
            'cpuUsage': f"{cpu_percent:.2f}%",
            'memoryUsage': f"{memory_usage / (1024 * 1024):.2f} MB",
        }
    except Exception as e:
        print(f"Error al obtener estadísticas del contenedor {container_id}: {e}")
        return None

def get_host_stats():
    ssh_client = paramiko.SSHClient()
    ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh_client.connect('18.212.95.23', username='ubuntu', key_filename='/home/jomaol/Documents/DAEA/keys/ubuntu08.pem')

    cpu_usage = ""
    memory_usage = ""

    stdin, stdout, stderr = ssh_client.exec_command("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | awk -F. '{print $1}'")
    cpu_usage = stdout.read().decode().strip() + "%"

    stdin, stdout, stderr = ssh_client.exec_command("free -m | awk 'NR==2{printf \"%s\", $3}'")
    memory_usage = stdout.read().decode().strip() + " MB"

    ssh_client.close()

    return {'cpuUsage': cpu_usage, 'memoryUsage': memory_usage}

containers = [
    "digimon-microservice-container",
    "digimon-frontend-container",
    "my-flask-container",
]

while True:
    print("\n============================================================")
    print("            MONITOREO DEL HOST Y LOS CONTENEDORES                  ")
    print("============================================================\n")

    print("Host:")
    host_stats = get_host_stats()
    if host_stats:
        print(f"  Uso de CPU: {host_stats['cpuUsage']}")
        print(f"  Uso de Memoria: {host_stats['memoryUsage']}\n")
    else:
        print("  No se pudieron obtener las estadísticas del host.\n")

    print("Contenedores:")
    for container_id in containers:
        stats = get_container_stats(container_id)
        if stats:
            print(f"  {container_id}:")
            print(f"    Estado: {stats['status']}")
            print(f"    Uso de CPU: {stats['cpuUsage']}")
            print(f"    Uso de Memoria: {stats['memoryUsage']}\n")
        else:
            print(f"  No se pudieron obtener las estadísticas del contenedor {container_id}.\n")

    print("============================================================\n")
    time.sleep(5)

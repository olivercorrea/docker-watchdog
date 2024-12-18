import docker
import time
from datetime import datetime

# Configura la URL del Docker API de Play with Docker
DOCKER_HOST = 'tcp://192.168.0.28:2375'

# Nombre del contenedor que deseas monitorear
CONTAINER_NAME = 'blazor-app-container'

# Crea un cliente de Docker
client = docker.DockerClient(base_url=DOCKER_HOST)

def monitor_container():
    while True:
        try:
            # Obtiene el contenedor
            container = client.containers.get(CONTAINER_NAME)
            
            # Obtiene las estadísticas del contenedor
            stats = container.stats(stream=False)

            # Extrae el uso de CPU
            cpu_usage = stats['cpu_stats']['cpu_usage']['total_usage'] - stats['precpu_stats']['cpu_usage']['total_usage']
            cpu_usage_percent = (cpu_usage / stats['cpu_stats']['system_cpu_usage']) * stats['cpu_stats']['online_cpus'] * 100
            
            # Extrae el uso de memoria
            memory_usage = stats['memory_stats']['usage']
            memory_limit = stats['memory_stats']['limit']
            memory_usage_percent = (memory_usage / memory_limit) * 100
            
            # Obtiene estadísticas del host
            host_stats = client.info()

            # Imprime las estadísticas
            print(f"Tiempo: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"Uso de CPU del contenedor: {cpu_usage_percent:.2f}%")
            print(f"Uso de memoria del contenedor: {memory_usage / (1024 ** 2):.2f} MB / {memory_limit / (1024 ** 2):.2f} MB ({memory_usage_percent:.2f}%)")
            print(f"Núcleos de CPU del host: {host_stats['NCPU']} cores")
            print(f"Uso total de memoria del host: {host_stats['MemTotal'] / (1024 ** 2):.2f} MB")
            print("---")
        except Exception as e:
            print(f"Error: {e}")
        
        # Espera 5 segundos antes de la siguiente verificación
        time.sleep(5)

if __name__ == "__main__":
    monitor_container()

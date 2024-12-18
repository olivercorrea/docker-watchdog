import docker
import time

def get_container_stats(container_id, base_url):
    client = docker.DockerClient(base_url=base_url)
    container = client.containers.get(container_id)
    stats = container.stats(stream=False)

    cpu_usage = stats['cpu_stats']['cpu_usage']['total_usage']
    system_cpu_usage = stats['cpu_stats']['system_cpu_usage']
    memory_usage = stats['memory_stats']['usage']
    memory_limit = stats['memory_stats']['limit']

    cpu_percent = (cpu_usage / system_cpu_usage) * 100.0
    memory_percent = (memory_usage / memory_limit) * 100.0

    print(f"CPU Usage: {cpu_percent:.2f}%")
    print(f"Memory Usage: {memory_usage / (1024 * 1024):.2f} MB")
    print(f"Memory Limit: {memory_limit / (1024 * 1024):.2f} MB")
    print(f"Memory Usage Percentage: {memory_percent:.2f}%")

if __name__ == "__main__":
    container_id = "blazor-app-container"
    ec2_ip = "54.173.170.215"
    base_url = f"tcp://{ec2_ip}:2375"

    while True:
        get_container_stats(container_id, base_url)
        time.sleep(5)

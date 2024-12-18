import psutil
import time

def get_system_stats():
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)
    print(f"CPU Usage: {cpu_percent}%")

    # Memory usage
    memory_info = psutil.virtual_memory()
    memory_percent = memory_info.percent
    memory_used = memory_info.used / (1024 ** 2)  # Convert to MB
    memory_total = memory_info.total / (1024 ** 2)  # Convert to MB
    print(f"Memory Usage: {memory_used:.2f} MB / {memory_total:.2f} MB ({memory_percent}%)")

    # Disk usage
    disk_info = psutil.disk_usage('/')
    disk_percent = disk_info.percent
    disk_used = disk_info.used / (1024 ** 3)  # Convert to GB
    disk_total = disk_info.total / (1024 ** 3)  # Convert to GB
    print(f"Disk Usage: {disk_used:.2f} GB / {disk_total:.2f} GB ({disk_percent}%)")

if __name__ == "__main__":
    while True:
        get_system_stats()
        time.sleep(5)  # Adjust the interval as needed


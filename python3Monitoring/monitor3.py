# Do not work
import paramiko
import time
import json

def get_remote_system_stats(host, port, username, key_filename):
    try:
        # Create an SSH client
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(host, port=port, username=username, key_filename=key_filename)

        # Command to get system stats using psutil
        command = """
        python3 -c "
        import psutil, json;
        stats = {
            'cpu_percent': psutil.cpu_percent(interval=1),
            'memory': psutil.virtual_memory()._asdict(),
            'disk': psutil.disk_usage('/')._asdict()
        };
        print(json.dumps(stats))
        "
        """

        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        stats = json.loads(output)

        client.close()

        return stats
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    host = '44.202.22.157'
    port = 22  # Default SSH port
    username = 'ubuntu'  # Default username for Ubuntu instances
    key_filename = '/home/jomaol/Documents/DAEA/keys/ubuntu1.pem'  # Path to your PEM key

    while True:
        stats = get_remote_system_stats(host, port, username, key_filename)
        if stats:
            cpu_percent = stats['cpu_percent']
            memory_info = stats['memory']
            disk_info = stats['disk']

            print(f"CPU Usage: {cpu_percent}%")
            print(f"Memory Usage: {memory_info['used'] / (1024 ** 2):.2f} MB / {memory_info['total'] / (1024 ** 2):.2f} MB ({memory_info['percent']}%)")
            print(f"Disk Usage: {disk_info['used'] / (1024 ** 3):.2f} GB / {disk_info['total'] / (1024 ** 3):.2f} GB ({disk_info['percent']}%)")

        time.sleep(5)  # Adjust the interval as needed

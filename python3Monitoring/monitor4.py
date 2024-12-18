# Monitor host remotely
import paramiko
import time
import json

def get_remote_system_stats(host, port, username, key_filename):
    try:

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(host, port=port, username=username, key_filename=key_filename)


        command = """
python3 -c "
import psutil, json
stats = {
    'cpu_percent': psutil.cpu_percent(interval=1),
    'memory': psutil.virtual_memory()._asdict(),
    'disk': psutil.disk_usage('/')._asdict()
}
print(json.dumps(stats))
"
"""

        stdin, stdout, stderr = client.exec_command(command)
        output = stdout.read().decode()
        error = stderr.read().decode()

        if error:
            print(f"Error: {error}")
            return None

        if not output:
            print("No output received from the remote server")
            return None

        stats = json.loads(output)

        client.close()

        return stats
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    host = '44.202.22.157'
    port = 22
    username = 'ubuntu'
    key_filename = '/home/jomaol/Documents/DAEA/keys/ubuntu1.pem'

    while True:
        stats = get_remote_system_stats(host, port, username, key_filename)
        if stats:
            cpu_percent = stats['cpu_percent']
            memory_info = stats['memory']
            disk_info = stats['disk']

            print(f"CPU Usage: {cpu_percent}%")
            print(f"Memory Usage: {memory_info['used'] / (1024 ** 2):.2f} MB / {memory_info['total'] / (1024 ** 2):.2f} MB ({memory_info['percent']}%)")
            print(f"Disk Usage: {disk_info['used'] / (1024 ** 3):.2f} GB / {disk_info['total'] / (1024 ** 3):.2f} GB ({disk_info['percent']}%)")

        time.sleep(5)

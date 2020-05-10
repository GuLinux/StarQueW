from .network_manager import NetworkManager

from utils.threads import start_thread
import time
from system import event_listener
from errors import BadRequestError, FailedMethodError
from app import logger
import os
import subprocess

class NetworkService:
    def __init__(self):
        self.nm = NetworkManager()

        self.connections, self.active_connections = [], []

    def start(self):
        start_thread(self.__loop)

    def to_map(self):
        return {
            'connections': [c.to_map() for c in self.connections],
            'active_connections': [c.to_map() for c in self.active_connections],
        }

    def access_points(self):
        return self.__nm_command(['access-points', '--json'])

    def add_wifi(self, ssid, psk, autoconnect=False, priority=0, ap_mode=False, nm_id=None):
        command = ['add-wifi', ssid, psk, '--autoconnect-priority', str(priority)]
        if autoconnect:
            command.append('--autoconnect')
        if ap_mode:
            command.append('--access-point')
        if nm_id:
            command.extend(['--name', nm_id])
        self.__nm_command(command)
        return { 'status': 'adding_wifi', 'ssid': ssid }

    def activate_connection(self, connection, device=None):
        command = ['activate']
        if device:
            command.extend(['--device', device])
        self.__nm_command(command)
        return { 'status': 'activating', 'connection': connection }

    def deactivate_connection(self, connection):
        self.nm_command(['deactivate', connection])
        return { 'status': 'deactivating', 'connection': connection }


    def remove_connection(self, connection):
        self.nm_command(['remove', connection])
        return { 'status': 'removing', 'connection': connection }


    def __loop(self):
        connections = self.nm.list_connections()
        active_connections = self.nm.active_connections()

        if connections != self.connections or active_connections != self.active_connections:
            self.connections = connections
            self.active_connections = active_connections
            event_listener.on_network_changed(self.to_map())

        time.sleep(1)

    def __get_ids(self, connections):
        return [c.id for c in connections]

    def __nm_command(self, parameters):
        network_manager_path = os.path.join(os.path.dirname(__file__), 'network_manager.py')
        cmdline = ['sudo', network_manager_path]
        cmdline.extend(parameters)
        logger.debug(cmdline)
        proc = subprocess.run(cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise FailedMethodError('Error running NetworkManager command: {}'.format(proc.stderr))
        return proc.stdout

network_service = NetworkService()

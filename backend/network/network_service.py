from .network_manager import NetworkManager

from functools import wraps
from utils.threads import start_thread
import time
from system import event_listener, settings
from errors import BadRequestError, FailedMethodError
from app import logger
import os
import subprocess
import json as JSON

def on_connection_changing(f):
    @wraps(f)
    def f_wrapper(self, *args, **kwargs):
        # give the connection timeout some extra time to let things get stable
        self.last_connection_check = time.time() - 30
        return f(self, *args, **kwargs)
    return f_wrapper



class NetworkService:
    def __init__(self):
        self.nm = NetworkManager()
        self.connections, self.active_connections = [], []

    def start(self):
        self.last_connection_check = time.time()
        start_thread(self.__loop)

    def to_map(self):
        return {
            'connections': self.connections,
            'activeConnections': self.active_connections,
        }

    def access_points(self):
        return self.__nm_command('access-points', '--json', json=True)

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

    def update_wifi(self, nm_id, ssid, psk, autoconnect=False, priority=0, ap_mode=False, rename=None):
        command = ['update-wifi', nm_id, ssid, psk, '--autoconnect-priority', str(priority)]
        if autoconnect:
            command.append('--autoconnect')
        if ap_mode:
            command.append('--access-point')
        if nm_id:
            command.extend(['--rename', rename])
        self.__nm_command(command)
        return { 'status': 'saving_wifi', 'ssid': ssid }


    @on_connection_changing
    def activate_connection(self, connection, device=None):
        command = ['activate', connection]
        if device:
            command.extend(['--device', device])
        self.__nm_command(command)
        return { 'status': 'activating', 'connection': connection }

    @on_connection_changing
    def deactivate_connection(self, connection):
        self.__nm_command(['deactivate', connection])
        return { 'status': 'deactivating', 'connection': connection }


    @on_connection_changing
    def remove_connection(self, connection):
        self.__nm_command(['remove', connection])
        return { 'status': 'removing', 'connection': connection }


    def __loop(self):
        while True:
            try:
                connections = self.__nm_command(['connections', '--json'], json=True)
                active_connections = self.__nm_command(['active-connections', '--json'], json=True)
            except:
                logger.warning('Error fetching NetworkManager connections')

            if connections != self.connections or active_connections != self.active_connections:
                self.connections = connections
                self.active_connections = active_connections
                event_listener.on_network_changed(self.to_map())

            self.__check_active_connections()

            time.sleep(1)

    def __check_active_connections(self):
        # logger.debug('check_active_connections: elapsed={}'.format(time.time() - self.last_connection_check))
        autoconnect_access_point_timeout = settings.autoconnect_access_point_timeout
        if autoconnect_access_point_timeout and time.time() - self.last_connection_check > autoconnect_access_point_timeout:
            logger.debug('check_active_connections: active_connections={}'.format(len(self.active_connections)))
            if not self.active_connections:
                if not self.__autoconnect_access_point():
                    logger.debug('check_active_connections: no access point connection found')
                    return
            logger.debug('check_active_connections: connected or accesspoint activated')
            self.last_connection_check = time.time()

    def __autoconnect_access_point(self):
        existing_accesspoint = [c for c in self.connections if c.get('isAccessPoint', False)]
        logger.debug('autoconnect_access_point: Existing accesspoint: {}'.format(existing_accesspoint))
        if not existing_accesspoint:
            ssid_name = 'AstroPhoto-Plus-{}'.format(settings.server_name) if settings.server_name else 'AstroPhoto-Plus'
            logger.debug('autoconnect_access_point: Creating accesspoint: {}'.format(ssid_name))
            self.add_wifi(ssid_name, 'AstroPhoto-Plus', ap_mode=True)
            return False
        logger.debug('autoconnect_access_point: Activating accesspoint: {}'.format(existing_accesspoint[0]))
        self.activate_connection(existing_accesspoint[0]['id'])
        return True

    def __get_ids(self, connections):
        return [c.id for c in connections]

    def __nm_command(self, args, json=False, sudo=True):
        network_manager_path = os.path.join(os.path.dirname(__file__), 'network_manager.py')
        cmdline = []
        if sudo:
            cmdline.append('sudo')

        cmdline.append(network_manager_path)
        cmdline.extend(args)
        # logger.debug(cmdline)
        proc = subprocess.run(cmdline, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode != 0:
            raise FailedMethodError('Error running NetworkManager command: {}'.format(proc.stderr))
        if json:
            return JSON.loads(proc.stdout)
        return proc.stdout

network_service = NetworkService()

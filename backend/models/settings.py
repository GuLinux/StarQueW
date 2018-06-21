import os
from .serializer import Serializer
from .exceptions import BadRequestError
import six


class Settings:
    def __init__(self, on_update=None):
        self.default_datadir = os.environ.get('STARQUEW_DATADIR', os.path.join(os.environ['HOME'], 'StarQuew-Data'))
        self.serializer = Serializer(self.__build_path(['.config', 'StarQuew', 'settings.json'], isdir=False), Settings)
        self.sequences_list = self.__build_path(['.config', 'StarQuew', 'sequences'], isdir=True)
        self.indi_profiles_list = self.__build_path(['.config', 'StarQuew', 'indi_profiles'], isdir=True)
        self.indi_service_logs = self.__build_path(['.cache', 'StarQuew', 'logs', 'indi_service'], isdir=True)

        self.ro_props = ['default_datadir', 'sequences_list', 'indi_profiles_list', 'indi_service_logs']
        self.rw_props = ['sequences_dir', 'indi_prefix', 'indi_host', 'indi_port', 'indi_service']

        self.on_update = on_update
        self.reload()

    def reload(self):
        self.json_map = {}
        try:
            self.json_map = self.serializer.get_map()
        except FileNotFoundError:
            pass

    def to_map(self):
        props = []
        props.extend(self.ro_props)
        props.extend(self.rw_props)
        map_object = {}
        for prop in props:
            map_object[prop] = getattr(self, prop)
        return map_object

    @property
    def camera_tempdir(self):
        return self.__build_path(['.cache', 'StarQuew', 'camera'], isdir=True)

    @property
    def sequences_dir(self):
        return self.json_map.get('sequences_dir', os.path.join(self.default_datadir, 'Sequences'))

    @property
    def indi_prefix(self):
        return self.json_map.get('indi_prefix', '/usr')

    @property
    def indi_host(self):
        if self.indi_service:
            return 'localhost'
        return self.json_map.get('indi_host', 'localhost')

    @property
    def indi_port(self):
        if self.indi_service:
            return 7624
        return self.json_map.get('indi_port', 7624)

    @property
    def indi_service(self):
        return self.json_map.get('indi_service', True)

    def update(self, new_data):
        ro_props = [x for x in new_data.keys() if x in self.ro_props]
        unsupported_props = [x for x in new_data.keys() if x not in self.rw_props]
        if ro_props:
            raise BadRequestError('The following settings are read only and cannot be updated: {}'.format(', '.join(ro_props)))
        if unsupported_props:
            raise BadRequestError('The following settings are invalid: {}'.format(', '.join(unsupported_props)))

        on_update_args = [(x, getattr(self, x), new_data[x]) for x in new_data.keys()]
        
        self.json_map.update(new_data)
        self.serializer.save(self)

        if self.on_update:
            for new_item in on_update_args:
                self.on_update(*new_item)

    def __build_path(self, components, root=None, isdir=False):
        path = os.path.join(root if root else os.environ['HOME'], *components)
        os.makedirs(path if isdir else os.path.dirname(path), exist_ok=True)
        return path

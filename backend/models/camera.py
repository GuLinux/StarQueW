from .device import Device
from .exceptions import NotFoundError
from .saved_list import SavedList
from .model import random_id
import os
import time



class Image:
    def __init__(self, id, directory, filename, timestamp):
        self.id = id
        self.directory = directory
        self.filename = filename
        self.timestamp = timestamp

    @property
    def path(self):
        return os.path.join(self.directory, self.filename)

    @staticmethod
    def from_map(item):
        return Image(item['id'], item['directory'], item['filename'], item['timestamp'])

    def to_map(self):
        return {
            'id': self.id,
            'directory': self.directory,
            'filename': self.filename,
            'path': self.path,
            'timestamp': self.timestamp,
        }

class Camera:
    def __init__(self, settings, client, logger, device=None, camera=None):
        self.settings = settings
        self.client = client
        self.logger = logger
        self.images_list = SavedList(settings.camera_tempdir, Image)

        if device:
            self.device = device
            self.camera = [c for c in self.client.cameras() if c.name == device.name]
            if not self.camera:
                raise NotFoundError('Camera {} not found'.format(device.name))
            self.camera = self.camera[0]

        elif camera:
            self.camera = camera
            self.device = Device(client, logger, name=camera.name)

    @property
    def id(self):
        return self.device.id

    def to_map(self):
        return {
            'id': self.id,
            'device': self.device.to_map(),
            'connected': self.camera.connected,
        }


    def indi_sequence_camera(self):
        return self.camera

    def shoot_image(self, options):
        exposure = options['exposure']
        self.camera.set_upload_to('local')
        id = random_id(None)
        self.camera.set_upload_path(self.settings.camera_tempdir, prefix=id)
        self.camera.shoot(exposure)
        filename = [x for x in os.listdir(self.settings.camera_tempdir) if x.startswith(id)][0]
        image = Image(id, self.settings.camera_tempdir, filename, time.time())
        self.images_list.append(image)

        return image.to_map()

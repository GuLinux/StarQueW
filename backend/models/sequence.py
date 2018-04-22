import uuid
from .exceptions import NotFoundError
from .sequence_item import SequenceItem
import os

class Sequence:
    def __init__(self, name, upload_path, camera, filter_wheel=None, id=None, sequence_items=None, status=None):
        self.name = name
        self.upload_path = upload_path
        self.camera = camera
        self.filter_wheel = filter_wheel
        self.id = id if id else uuid.uuid4().hex
        self.sequence_items = sequence_items if sequence_items else []
        self.status = status if status else 'idle'

    def item(self, sequence_item_id):
        sequence_item = [x for x in self.sequence_items if x.id == sequence_item_id]
        if sequence_item:
            return sequence_item[0]
        raise NotFoundError()

    @staticmethod
    def from_map(map_object):
        return Sequence(
            map_object['name'],
            map_object['directory'],
            map_object['camera'],
            map_object['filterWheel'],
            id=map_object['id'],
            sequence_items=[SequenceItem.from_map(x) for x in map_object['sequenceItems']],
            status=map_object['status']
        )

    def to_map(self):
        return {
            'id': self.id,
            'name': self.name,
            'camera': self.camera,
            'filterWheel': self.filter_wheel,
            'directory': self.upload_path,
            'sequenceItems': [x.to_map() for x in self.sequence_items],
            'status': self.status,
        }

    def duplicate(self):
        new_sequence = Sequence(self.name, self.upload_path, self.camera, self.filter_wheel)
        for item in self.sequence_items:
            new_sequence.sequence_items.append(item.duplicate())

        return new_sequence

    def run(self, server, root_directory, logger, on_update=None):
        camera = [c for c in server.cameras() if c.id == self.camera]
        if not camera:
            raise NotFoundError('Camera with id {} not found'.format(self.camera))
        camera = camera[0]

        filter_wheel = None
        if self.filter_wheel:
            filter_wheel = [f for f in server.filter_wheels() if f.id == self.filter_wheel]
            if not filter_wheel:
                raise NotFoundError('Filter wheel with id {} not found'.format(self.filter_wheel))
            filter_wheel = filter_wheel[0]
 
        logger.debug('Starting sequence with camera: {}={} and filter_wheel: {}={}'.format(self.camera, camera.device.name, self.filter_wheel, filter_wheel.device.name if filter_wheel else 'N/A'))

        for sequence_item in self.sequence_items:
            logger.debug('resetting sequence item {}'.format(sequence_item))
            sequence_item.reset()

        self.status = 'running'

        on_update()
        try:
            for sequence_item in self.sequence_items:
                sequence_item.run(server, {'camera': camera, 'filter_wheel': filter_wheel}, os.path.join(root_directory, self.upload_path), logger, on_update)
            self.status = 'finished'
            on_update()
        except RuntimeError as e:
            logger.exception('error running sequence')
            self.status = 'error'
            on_update()
            raise e

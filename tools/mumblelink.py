# Simple MumbleLink reader for GW2
#
# @created      15.10.2019
# @author       smiley <smiley@chillerlan.net>
# @copyright    2019 smiley
# @license      MIT
#
# @link https://wiki.guildwars2.com/wiki/API:MumbleLink

import ctypes
import mmap
import json


class Link(ctypes.Structure):
    _fields_ = [
        ("uiVersion", ctypes.c_uint32),
        ("uiTick", ctypes.c_ulong),
        ("fAvatarPosition", ctypes.c_float * 3),
        ("fAvatarFront", ctypes.c_float * 3),
        ("fAvatarTop", ctypes.c_float * 3),
        ("name", ctypes.c_wchar * 256),
        ("fCameraPosition", ctypes.c_float * 3),
        ("fCameraFront", ctypes.c_float * 3),
        ("fCameraTop", ctypes.c_float * 3),
        ("identity", ctypes.c_wchar * 256),
        ("context_len", ctypes.c_uint32),
    ]


class Context(ctypes.Structure):
    _fields_ = [
        ("serverAddress", ctypes.c_byte * 28),
        ("mapId", ctypes.c_uint32),
        ("mapType", ctypes.c_uint32),
        ("shardId", ctypes.c_uint32),
        ("instance", ctypes.c_uint32),
        ("buildId", ctypes.c_uint32),
        ("uiState", ctypes.c_uint32),
        ("compassWidth", ctypes.c_uint16),
        ("compassHeight", ctypes.c_uint16),
        ("compassRotation", ctypes.c_float),
        ("playerX", ctypes.c_float),
        ("playerY", ctypes.c_float),
        ("mapCenterX", ctypes.c_float),
        ("mapCenterY", ctypes.c_float),
        ("mapScale", ctypes.c_float),
    ]


class MumbleLink:
    data: Link
    context: Context

    def __init__(self):
        memfile = mmap.mmap(-1, 4096, "MumbleLink", mmap.ACCESS_READ)
        memfile.seek(0)

        self.data = self.unpack(Link, memfile.read(ctypes.sizeof(Link)))
        self.context = self.unpack(Context, memfile.read(ctypes.sizeof(Context)))

        memfile.close()

    def to_json(self):
        identity = json.loads(self.data.identity)

        js = {
            "name": identity['name'],
            "profession": identity['profession'],
            "race": identity['race'],
            "spec": identity['spec'],
            "commander": identity['commander'],
            "team_color_id": identity['team_color_id'],
            "map_id": self.context.mapId,
            "build_id": self.context.buildId,
            "ui_tick": self.data.uiTick,
#           "avatar_position": [round(self.data.fAvatarPosition[0], 5), round(self.data.fAvatarPosition[2], 5)],
            "position": [round(self.context.playerX), round(self.context.playerY)],
        }

        return json.dumps(js)

    @staticmethod
    def unpack(ctype, buf):
        cstring = ctypes.create_string_buffer(buf)
        ctype_instance = ctypes.cast(ctypes.pointer(cstring), ctypes.POINTER(ctype)).contents
        return ctype_instance


def main():
    ml = MumbleLink()
    print(ml.to_json())


if __name__ == "__main__":
    main()

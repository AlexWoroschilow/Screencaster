#! /bin/sh

#ffplay -fflags nobuffer -flags low_delay -framedrop -strict experimental -i udp://192.168.2.89:1234
mpv --profile=low-latency --cache=no --opengl-glfinish=yes --framedrop=vo udp://192.168.2.89:1234
